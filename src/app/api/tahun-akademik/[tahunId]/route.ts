import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { unlinkIfExists } from '@/lib/upload-paths';

// DELETE /api/tahun-akademik/[tahunId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tahunId: string }> }
) {
  const { tahunId } = await params;
  try {
    // Collect all matkul IDs under this tahun akademik
    const semesters = await prisma.semester.findMany({
      where: { tahunAkademikId: tahunId },
      select: { id: true },
    });
    const semesterIds = semesters.map(s => s.id);
    const matkuls = await prisma.matkul.findMany({
      where: { semesterId: { in: semesterIds } },
      select: { id: true },
    });
    const matkulIds = matkuls.map(m => m.id);

    // Unlink all files from disk
    const rpsList = await prisma.rPS.findMany({
      where: { matkulId: { in: matkulIds } },
      select: { fileUrl: true, annotatedPdfUrl: true, koordinatorSigUrl: true, koordinatorSignedPdfUrl: true, kaprodiSigUrl: true, finalPdfUrl: true },
    });
    const docList = await prisma.academicDocument.findMany({
      where: { matkulId: { in: matkulIds } },
      select: { fileUrl: true, annotatedPdfUrl: true, koordinatorSigUrl: true, koordinatorSignedPdfUrl: true, kaprodiSigUrl: true, finalPdfUrl: true },
    });
    const allUrls = [...rpsList, ...docList].flatMap(r => [
      r.fileUrl, r.annotatedPdfUrl, r.koordinatorSigUrl, r.koordinatorSignedPdfUrl, r.kaprodiSigUrl, r.finalPdfUrl,
    ]);
    await Promise.all(allUrls.map(url => unlinkIfExists(url)));

    // DB cascade handles semester → matkul → rps/docs
    await prisma.tahunAkademik.delete({ where: { id: tahunId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
