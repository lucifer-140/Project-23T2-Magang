import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { PDFDocument } from 'pdf-lib';
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

  const { reviewer, sigData, sigX, sigY, sigPage, sigWidth } = await req.json();

  if (!reviewer || !sigData || sigX == null || sigY == null || !sigPage || !sigWidth) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (reviewer !== 'koordinator' && reviewer !== 'kaprodi') {
    return NextResponse.json({ error: 'Invalid reviewer' }, { status: 400 });
  }

  const doc = await prisma.academicDocument.findUnique({ where: { id: docId } });
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  let sourcePdfUrl: string | null;
  if (reviewer === 'koordinator') {
    sourcePdfUrl = doc.fileUrl;
  } else {
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
