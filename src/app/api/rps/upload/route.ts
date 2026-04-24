import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { notifyUsers } from '@/lib/notifications';
import path from 'path';
import { writeFile, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import { getUploadDir, sanitizeName, unlinkIfExists } from '@/lib/upload-paths';

const GOTENBERG_URL = process.env.GOTENBERG_URL ?? 'http://localhost:3001';

async function convertDocxToPdf(docxPath: string): Promise<string | null> {
  const pdfPath = docxPath.replace(/\.(docx?)$/i, '.pdf');

  // Strategy 1: Gotenberg (Docker service - most reliable)
  try {
    const fileBytes = await readFile(docxPath);
    const fileName = path.basename(docxPath);

    const formData = new FormData();
    formData.append('files', new Blob([fileBytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }), fileName);

    const res = await fetch(`${GOTENBERG_URL}/forms/libreoffice/convert`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(60000),
    });

    if (res.ok) {
      const pdfBytes = Buffer.from(await res.arrayBuffer());
      await writeFile(pdfPath, pdfBytes);
      console.log('[DOCX→PDF] Gotenberg conversion succeeded:', pdfPath);
      return pdfPath;
    }
    console.warn('[DOCX→PDF] Gotenberg returned', res.status, await res.text().catch(() => ''));
  } catch (err) {
    console.warn('[DOCX→PDF] Gotenberg unavailable:', (err as Error).message);
  }

  // Strategy 2: LibreOffice CLI
  try {
    const { execSync } = await import('child_process');
    const outDir = path.dirname(docxPath);
    const commands = [
      `soffice --headless --convert-to pdf --outdir "${outDir}" "${docxPath}"`,
      `"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf --outdir "${outDir}" "${docxPath}"`,
    ];
    for (const cmd of commands) {
      try {
        execSync(cmd, { timeout: 30000, stdio: 'ignore' });
        if (existsSync(pdfPath)) return pdfPath;
      } catch { /* try next */ }
    }
  } catch { /* LibreOffice unavailable */ }

  // Strategy 3: mammoth (DOCX→HTML) + puppeteer (HTML→PDF)
  try {
    const mammoth = await import('mammoth');
    const puppeteer = await import('puppeteer');
    const { existsSync: fsExistsSync } = await import('fs');

    const { value: html } = await mammoth.convertToHtml({ path: docxPath });

    const styledHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 2.5cm; line-height: 1.5; color: #000; }
  h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 12pt; }
  h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; }
  h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; margin-bottom: 4pt; }
  table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
  th, td { border: 1px solid #333; padding: 6pt 8pt; font-size: 11pt; vertical-align: top; }
  th { background-color: #e8e8e8; font-weight: bold; }
  p { margin: 6pt 0; }
  ul, ol { margin: 6pt 0; padding-left: 20pt; }
  li { margin: 3pt 0; }
</style>
</head>
<body>${html}</body>
</html>`;

    const windowsChromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    const systemExec = windowsChromePaths.find(p => fsExistsSync(p));

    const launchOptions: Parameters<typeof puppeteer.default.launch>[0] = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    };
    if (systemExec) launchOptions.executablePath = systemExec;

    const browser = await puppeteer.default.launch(launchOptions);
    const page = await browser.newPage();
    await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: { top: '2cm', bottom: '2cm', left: '2.5cm', right: '2.5cm' },
      printBackground: true,
    });
    await browser.close();

    if (existsSync(pdfPath)) return pdfPath;
  } catch (err) {
    console.error('[DOCX→PDF] puppeteer conversion failed:', err);
  }

  return null;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const matkulId = formData.get('matkulId') as string;
  const dosenId = formData.get('dosenId') as string;
  const rpsId = formData.get('rpsId') as string | null;

  if (!file || !matkulId || !dosenId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const uploadDir = getUploadDir('rps', 'drafts');
  const safeFileName = `${rpsId ? rpsId + '_' : Date.now() + '_'}${sanitizeName(file.name)}`;
  const filePath = path.join(uploadDir, safeFileName);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  // Convert DOCX to PDF if needed
  let finalFileName = file.name;
  let fileUrl = `/uploads/rps/drafts/${safeFileName}`;

  const isDocx = /\.(docx?)$/i.test(file.name);
  if (isDocx) {
    const pdfPath = await convertDocxToPdf(filePath);
    if (pdfPath) {
      await unlink(filePath).catch(() => {});
      finalFileName = file.name.replace(/\.(docx?)$/i, '.pdf');
      fileUrl = `/uploads/rps/drafts/${path.basename(pdfPath)}`;
    }
  }

  let rps;
  if (rpsId) {
    // Clean up all old files before overwriting
    const oldRps = await prisma.rPS.findUnique({
      where: { id: rpsId },
      select: { fileUrl: true, annotatedPdfUrl: true, koordinatorSigUrl: true, koordinatorSignedPdfUrl: true, kaprodiSigUrl: true, finalPdfUrl: true },
    });
    if (oldRps) {
      await Promise.all([
        unlinkIfExists(oldRps.fileUrl),
        unlinkIfExists(oldRps.annotatedPdfUrl),
        unlinkIfExists(oldRps.koordinatorSigUrl),
        unlinkIfExists(oldRps.koordinatorSignedPdfUrl),
        unlinkIfExists(oldRps.kaprodiSigUrl),
        unlinkIfExists(oldRps.finalPdfUrl),
      ]);
    }
    // Delete all previous annotations - they reference the old file's coordinates
    await prisma.rpsAnnotation.deleteMany({ where: { rpsId } });

    rps = await prisma.rPS.update({
      where: { id: rpsId },
      data: {
        fileName: finalFileName,
        fileUrl,
        status: 'SUBMITTED',
        isKoordinatorApproved: false,
        koordinatorNotes: null,
        kaprodiNotes: null,
        annotatedPdfUrl: null,
        // Reset all signature state so the chain restarts
        koordinatorSigUrl: null,
        koordinatorSigX: null,
        koordinatorSigY: null,
        koordinatorSigPage: null,
        koordinatorSigWidth: null,
        koordinatorSignedPdfUrl: null,
        kaprodiSigUrl: null,
        kaprodiSigX: null,
        kaprodiSigY: null,
        kaprodiSigPage: null,
        kaprodiSigWidth: null,
        finalPdfUrl: null,
      },
    });
  } else {
    rps = await prisma.rPS.create({
      data: {
        matkulId,
        dosenId,
        fileName: finalFileName,
        fileUrl,
        status: 'SUBMITTED',
      },
    });
  }

  // Notify koordinators of this matkul
  const matkul = await prisma.matkul.findUnique({
    where: { id: matkulId },
    select: { code: true, koordinators: { select: { id: true } } },
  });
  const dosen = await prisma.user.findUnique({ where: { id: dosenId }, select: { name: true } });
  if (matkul && dosen && matkul.koordinators.length > 0) {
    await notifyUsers(
      matkul.koordinators.map(k => k.id),
      `${dosen.name} mengupload RPS untuk ${matkul.code} dan menunggu review Anda.`,
      `/dashboard/koordinator/rps`,
    );
  }

  return NextResponse.json(rps, { status: 200 });
}
