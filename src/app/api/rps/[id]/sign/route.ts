import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { PDFDocument } from 'pdf-lib';
import path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

// POST /api/rps/[id]/sign
// Body: JSON {
//   reviewer: 'koordinator' | 'kaprodi'
//   sigData: string  — base64-encoded PNG (data URL OK)
//   sigX: number     — 0-100 (% from left of page)
//   sigY: number     — 0-100 (% from top of page)
//   sigPage: number  — 1-based page number
//   sigWidth: number — 0-100 (% of page width)
// }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  const { reviewer, sigData, sigX, sigY, sigPage, sigWidth } = await req.json();

  if (!reviewer || !sigData || sigX == null || sigY == null || !sigPage || !sigWidth) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (reviewer !== 'koordinator' && reviewer !== 'kaprodi') {
    return NextResponse.json({ error: 'Invalid reviewer' }, { status: 400 });
  }

  const rps = await prisma.rPS.findUnique({ where: { id } });
  if (!rps) return NextResponse.json({ error: 'RPS not found' }, { status: 404 });

  // Determine the source PDF to stamp
  // Koordinator stamps the original fileUrl
  // Kaprodi stamps the koordinator-signed PDF (if exists) or original
  let sourcePdfUrl: string | null;
  if (reviewer === 'koordinator') {
    sourcePdfUrl = rps.fileUrl;
  } else {
    sourcePdfUrl = rps.koordinatorSignedPdfUrl ?? rps.fileUrl;
  }

  if (!sourcePdfUrl) {
    return NextResponse.json({ error: 'No source PDF found' }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  // Load source PDF bytes
  const sourcePdfPath = path.join(process.cwd(), 'public', sourcePdfUrl);
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await readFile(sourcePdfPath);
  } catch {
    return NextResponse.json({ error: 'Source PDF file not readable' }, { status: 500 });
  }

  // Load and stamp signature using pdf-lib
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const pageIndex = Math.max(0, Math.min(sigPage - 1, pages.length - 1));
  const page = pages[pageIndex];
  const { width: pageWidth, height: pageHeight } = page.getSize();

  // Decode the base64 signature PNG
  const base64Data = sigData.includes(',') ? sigData.split(',')[1] : sigData;
  const sigBuffer = Buffer.from(base64Data, 'base64');

  let embeddedSig;
  try {
    embeddedSig = await pdfDoc.embedPng(sigBuffer);
  } catch {
    // Try as JPEG if PNG fails
    embeddedSig = await pdfDoc.embedJpg(sigBuffer);
  }

  // Calculate actual dimensions in PDF points (PDF coordinate origin: bottom-left)
  const actualSigWidth = (sigWidth / 100) * pageWidth;
  const aspectRatio = embeddedSig.height / embeddedSig.width;
  const actualSigHeight = actualSigWidth * aspectRatio;

  const actualX = (sigX / 100) * pageWidth;
  // CSS Y=0 is top; PDF Y=0 is bottom — convert
  const actualY = pageHeight - (sigY / 100) * pageHeight - actualSigHeight;

  page.drawImage(embeddedSig, {
    x: actualX,
    y: actualY,
    width: actualSigWidth,
    height: actualSigHeight,
    opacity: 0.9,
  });

  // Save stamped PDF
  const stampedBytes = await pdfDoc.save();
  const outFileName = `${Date.now()}_signed_${reviewer}_${id}.pdf`;
  const outFilePath = path.join(uploadDir, outFileName);
  await writeFile(outFilePath, stampedBytes);
  const outFileUrl = `/uploads/${outFileName}`;

  // Save signature image for record
  const sigImageFileName = `${Date.now()}_sig_${reviewer}_${id}.png`;
  const sigImagePath = path.join(uploadDir, sigImageFileName);
  await writeFile(sigImagePath, sigBuffer);
  const sigImageUrl = `/uploads/${sigImageFileName}`;

  // Update database
  let updateData: Record<string, unknown>;
  if (reviewer === 'koordinator') {
    updateData = {
      isKoordinatorApproved: true,
      koordinatorId: userId ?? null,
      koordinatorNotes: null,
      status: 'SUBMITTED', // Stays SUBMITTED so kaprodi queue picks it up
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

  const updated = await prisma.rPS.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      status: true,
      isKoordinatorApproved: true,
      koordinatorSignedPdfUrl: true,
      finalPdfUrl: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}
