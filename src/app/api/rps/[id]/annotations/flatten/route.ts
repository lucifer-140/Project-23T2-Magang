import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { PDFDocument, rgb, LineCapStyle } from 'pdf-lib';
import path from 'path';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

// POST /api/rps/[id]/annotations/flatten
// Burns all saved annotations into the PDF and stores the result.
// Called automatically before rejection so Dosen receives a static annotated PDF.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try {
    if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw));
  } catch {
    roles = roleRaw ? [roleRaw] : [];
  }
  if (!roles.includes('KOORDINATOR') && !roles.includes('KAPRODI')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rps = await prisma.rPS.findUnique({
    where: { id },
    include: { annotations: { orderBy: { createdAt: 'asc' } } },
  });
  if (!rps) return NextResponse.json({ error: 'RPS not found' }, { status: 404 });

  // Nothing to flatten — skip gracefully
  if (rps.annotations.length === 0 || !rps.fileUrl) {
    return NextResponse.json({ annotatedPdfUrl: null });
  }

  const sourcePdfPath = path.join(process.cwd(), 'public', rps.fileUrl);
  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await readFile(sourcePdfPath);
  } catch {
    return NextResponse.json({ error: 'Source PDF not readable' }, { status: 500 });
  }

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();

  for (const ann of rps.annotations) {
    const pageIndex = Math.max(0, Math.min(ann.page - 1, pages.length - 1));
    const page = pages[pageIndex];
    const { width: pw, height: ph } = page.getSize();

    // Parse color — stored as hex string e.g. "#FFD700"
    const hex = ann.color.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const color = rgb(r, g, b);

    // Convert % coords → PDF points.
    // PDF origin is bottom-left; our Y% is measured from top.
    const toX = (xPct: number) => (xPct / 100) * pw;
    const toY = (yPct: number) => ph - (yPct / 100) * ph;

    if (ann.type === 'highlight' && ann.width != null && ann.height != null) {
      const x = toX(ann.x);
      const h = (ann.height / 100) * ph;
      // Y for the bottom-left corner of rect = top-Y minus height
      const y = toY(ann.y) - h;
      const w = (ann.width / 100) * pw;
      page.drawRectangle({ x, y, width: w, height: h, color, opacity: 0.35, borderWidth: 0 });
    }

    if (ann.type === 'box' && ann.width != null && ann.height != null) {
      const x = toX(ann.x);
      const h = (ann.height / 100) * ph;
      const y = toY(ann.y) - h;
      const w = (ann.width / 100) * pw;
      page.drawRectangle({
        x, y, width: w, height: h,
        borderColor: color, borderWidth: 1.2,
        color: undefined, opacity: 1,
      });
    }

    if (ann.type === 'draw' && ann.pathData) {
      let pts: { x: number; y: number }[];
      try {
        pts = JSON.parse(ann.pathData);
      } catch {
        continue;
      }
      if (pts.length < 2) continue;
      // Draw as a series of line segments
      for (let i = 0; i < pts.length - 1; i++) {
        page.drawLine({
          start: { x: toX(pts[i].x), y: toY(pts[i].y) },
          end: { x: toX(pts[i + 1].x), y: toY(pts[i + 1].y) },
          color,
          thickness: 1.5,
          lineCap: LineCapStyle.Round,
        });
      }
    }

    if (ann.type === 'sticky' && ann.content) {
      const x = toX(ann.x);
      const y = toY(ann.y);
      const boxW = pw * 0.18;
      const boxH = 24;
      const padding = 4;

      // Background box
      page.drawRectangle({
        x,
        y: y - boxH,
        width: boxW,
        height: boxH,
        color,
        opacity: 0.85,
        borderColor: color,
        borderWidth: 0.5,
      });

      // Note text (truncated to fit; pdf-lib draws single line)
      const maxChars = Math.floor(boxW / 4.5);
      const text = ann.content.length > maxChars
        ? ann.content.slice(0, maxChars - 1) + '…'
        : ann.content;

      page.drawText(text, {
        x: x + padding,
        y: y - boxH + padding,
        size: 7,
        color: rgb(0.1, 0.1, 0.1),
        maxWidth: boxW - padding * 2,
      });
    }
  }

  const flatBytes = await pdfDoc.save();
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  const outFileName = `${Date.now()}_annotated_${id}.pdf`;
  const outPath = path.join(uploadDir, outFileName);
  await writeFile(outPath, flatBytes);
  const annotatedPdfUrl = `/uploads/${outFileName}`;

  await prisma.rPS.update({
    where: { id },
    data: { annotatedPdfUrl },
  });

  return NextResponse.json({ annotatedPdfUrl });
}
