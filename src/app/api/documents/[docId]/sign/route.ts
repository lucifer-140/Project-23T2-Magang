import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

// POST /api/documents/[docId]/sign
// Body: { reviewer: 'koordinator' | 'kaprodi', sigData, sigX, sigY, sigPage, sigWidth }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  const { reviewer, sigData, sigX, sigY, sigPage, sigWidth, reviewerName } = await req.json();

  if (!reviewer || !sigData || sigX == null || sigY == null || !sigPage || !sigWidth) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (reviewer !== 'koordinator' && reviewer !== 'kaprodi' && reviewer !== 'prodi') {
    return NextResponse.json({ error: 'Invalid reviewer' }, { status: 400 });
  }

  const doc = await prisma.academicDocument.findUnique({ where: { id: docId } });
  if (reviewer === 'kaprodi' && !doc?.isProdiApproved) {
    return NextResponse.json({ error: 'Prodi must approve first' }, { status: 400 });
  }
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  let sourcePdfUrl: string | null;
  if (reviewer === 'koordinator') {
    sourcePdfUrl = doc.fileUrl;
  } else {
    // kaprodi and prodi both sign the koordinator-signed PDF
    sourcePdfUrl = doc.koordinatorSignedPdfUrl ?? doc.fileUrl;
  }
  if (!sourcePdfUrl) return NextResponse.json({ error: 'No source PDF found' }, { status: 400 });

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  const sourcePdfPath = path.join(process.cwd(), 'public', sourcePdfUrl);
  let pdfBytes: Uint8Array;
  try { pdfBytes = await readFile(sourcePdfPath); } catch {
    return NextResponse.json({ error: 'Source PDF file not readable' }, { status: 500 });
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const pageIndex = Math.max(0, Math.min(sigPage - 1, pages.length - 1));
  const page = pages[pageIndex];
  const { width: pageWidth, height: pageHeight } = page.getSize();

  const base64Data = sigData.includes(',') ? sigData.split(',')[1] : sigData;
  const sigBuffer = Buffer.from(base64Data, 'base64');

  let embeddedSig;
  try { embeddedSig = await pdfDoc.embedPng(sigBuffer); } catch {
    embeddedSig = await pdfDoc.embedJpg(sigBuffer);
  }

  const actualSigWidth = (sigWidth / 100) * pageWidth;
  const actualSigHeight = actualSigWidth * (embeddedSig.height / embeddedSig.width);
  const actualX = (sigX / 100) * pageWidth;
  const actualY = pageHeight - (sigY / 100) * pageHeight - actualSigHeight;

  page.drawImage(embeddedSig, { x: actualX, y: actualY, width: actualSigWidth, height: actualSigHeight, opacity: 0.9 });

  // Draw name + timestamp below signature
  if (reviewerName) {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = Math.max(6, actualSigWidth * 0.07);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())} WIB`;
    page.drawText(String(reviewerName), { x: actualX, y: actualY - fontSize - 3, size: fontSize, font, color: rgb(0, 0, 0) });
    page.drawText(dateStr, { x: actualX, y: actualY - fontSize * 2 - 5, size: fontSize * 0.85, font, color: rgb(0.3, 0.3, 0.3) });
  }

  const stampedBytes = await pdfDoc.save();
  const outFileName = `${Date.now()}_signed_${reviewer}_${docId}.pdf`;
  await writeFile(path.join(uploadDir, outFileName), stampedBytes);
  const outFileUrl = `/uploads/${outFileName}`;

  const sigImageFileName = `${Date.now()}_sig_${reviewer}_${docId}.png`;
  await writeFile(path.join(uploadDir, sigImageFileName), sigBuffer);
  const sigImageUrl = `/uploads/${sigImageFileName}`;

  let updateData: Record<string, unknown>;
  if (reviewer === 'koordinator') {
    updateData = {
      isKoordinatorApproved: true,
      koordinatorId: userId ?? null,
      koordinatorNotes: null,
      status: 'PENGECEKAN',
      koordinatorSigUrl: sigImageUrl,
      koordinatorSigX: sigX,
      koordinatorSigY: sigY,
      koordinatorSigPage: sigPage,
      koordinatorSigWidth: sigWidth,
      koordinatorSignedPdfUrl: outFileUrl,
    };
  } else if (reviewer === 'prodi') {
    updateData = {
      status: 'PENGECEKAN',
      isProdiApproved: true,
      prodiId: userId ?? null,
      prodiNotes: null,
      koordinatorSignedPdfUrl: outFileUrl,
    };
  } else {
    updateData = {
      status: 'APPROVED',
      kaprodiSigUrl: sigImageUrl,
      kaprodiSigX: sigX,
      kaprodiSigY: sigY,
      kaprodiSigPage: sigPage,
      kaprodiSigWidth: sigWidth,
      finalPdfUrl: outFileUrl,
    };
  }

  // On approval via signature, clear all annotations + annotatedPdfUrl
  // so the next reviewer (or dosen on approval) never sees stale annotations
  await prisma.academicDocAnnotation.deleteMany({ where: { docId } });
  updateData.annotatedPdfUrl = null;

  const updated = await prisma.academicDocument.update({
    where: { id: docId },
    data: updateData,
    select: { id: true, status: true, isKoordinatorApproved: true, koordinatorSignedPdfUrl: true, finalPdfUrl: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}
