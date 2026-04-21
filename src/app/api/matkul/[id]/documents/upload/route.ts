import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { DocType } from '@prisma/client';
import path from 'path';
import { writeFile, readFile, unlink } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

const GOTENBERG_URL = process.env.GOTENBERG_URL ?? 'http://localhost:3001';

async function convertDocxToPdf(docxPath: string): Promise<string | null> {
  const pdfPath = docxPath.replace(/\.(docx?)$/i, '.pdf');

  try {
    const fileBytes = await readFile(docxPath);
    const fileName = path.basename(docxPath);
    const formData = new FormData();
    formData.append('files', new Blob([fileBytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }), fileName);
    const res = await fetch(`${GOTENBERG_URL}/forms/libreoffice/convert`, {
      method: 'POST', body: formData, signal: AbortSignal.timeout(60000),
    });
    if (res.ok) {
      await writeFile(pdfPath, Buffer.from(await res.arrayBuffer()));
      return pdfPath;
    }
  } catch { /* Gotenberg unavailable */ }

  try {
    const { execSync } = await import('child_process');
    const outDir = path.dirname(docxPath);
    const commands = [
      `soffice --headless --convert-to pdf --outdir "${outDir}" "${docxPath}"`,
      `"C:\\Program Files\\LibreOffice\\program\\soffice.exe" --headless --convert-to pdf --outdir "${outDir}" "${docxPath}"`,
    ];
    for (const cmd of commands) {
      try { execSync(cmd, { timeout: 30000, stdio: 'ignore' }); if (existsSync(pdfPath)) return pdfPath; } catch { /* next */ }
    }
  } catch { /* LibreOffice unavailable */ }

  return null;
}

// POST /api/matkul/[id]/documents/upload
// FormData: { type: DocType, semesterId: string, file: File }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matkulId } = await params;

  const cookieStore = await cookies();
  const dosenId = cookieStore.get('userId')?.value;
  if (!dosenId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const typeRaw = formData.get('type') as string;
  const semesterId = formData.get('semesterId') as string;

  if (!typeRaw || !semesterId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const parseEppFloat = (v: FormDataEntryValue | null) => {
    if (v === null || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  };
  // Only include EPP fields that were explicitly sent in the FormData
  const eppFields: Record<string, number | null> = {};
  if (typeRaw === 'EPP') {
    for (const name of ['eppPersentaseMateri', 'eppPersentaseCpmk', 'eppPersentaseKehadiran', 'eppPersentaseNilaiB', 'eppPersentaseKkmToB']) {
      const v = formData.get(name);
      if (v !== null) eppFields[name] = parseEppFloat(v);
    }
  }

  const validTypes = Object.values(DocType);
  if (!validTypes.includes(typeRaw as DocType)) {
    return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
  }
  const type = typeRaw as DocType;

  // Check if already approved - locked
  const existing = await prisma.academicDocument.findUnique({
    where: { matkulId_dosenId_semesterId_type: { matkulId, dosenId, semesterId, type } },
  });
  if (existing?.status === 'APPROVED') {
    return NextResponse.json({ error: 'Document already approved and locked' }, { status: 409 });
  }

  // EPP-only save (no file) — just update fields
  if (!file) {
    if (Object.keys(eppFields).length === 0) {
      return NextResponse.json({ error: 'No file and no EPP fields' }, { status: 400 });
    }
    const doc = existing
      ? await prisma.academicDocument.update({ where: { id: existing.id }, data: eppFields })
      : await prisma.academicDocument.create({ data: { matkulId, dosenId, semesterId, type, status: 'UNSUBMITTED', ...eppFields } });
    return NextResponse.json(doc, { status: 200 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(uploadDir, safeFileName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  let finalFileName = file.name;
  let fileUrl = `/uploads/${safeFileName}`;

  const isDocx = /\.(docx?)$/i.test(file.name);
  if (isDocx) {
    const pdfPath = await convertDocxToPdf(filePath);
    if (pdfPath) {
      await unlink(filePath).catch(() => {});
      finalFileName = file.name.replace(/\.(docx?)$/i, '.pdf');
      fileUrl = `/uploads/${path.basename(pdfPath)}`;
    }
  }

  let doc;
  if (existing) {
    await prisma.academicDocAnnotation.deleteMany({ where: { docId: existing.id } });

    doc = await prisma.academicDocument.update({
      where: { id: existing.id },
      data: {
        fileName: finalFileName,
        fileUrl,
        status: 'SUBMITTED',
        isKoordinatorApproved: false,
        isProdiApproved: false,
        koordinatorNotes: null,
        kaprodiNotes: null,
        prodiNotes: null,
        annotatedPdfUrl: null,
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
        ...eppFields,
      },
    });
  } else {
    doc = await prisma.academicDocument.create({
      data: { matkulId, dosenId, semesterId, type, fileName: finalFileName, fileUrl, status: 'SUBMITTED', ...eppFields },
    });
  }

  return NextResponse.json(doc, { status: 200 });
}
