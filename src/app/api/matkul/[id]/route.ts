import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { notifyUsers, notifyRole } from '@/lib/notifications';
import { unlinkIfExists } from '@/lib/upload-paths';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const matkul = await prisma.matkul.findUnique({
      where: { id },
      include: {
        dosens: { select: { id: true } },
        koordinators: { select: { id: true } },
      },
    });

    // Unlink all files on disk before deleting DB rows
    const rpsList = await prisma.rPS.findMany({
      where: { matkulId: id },
      select: { fileUrl: true, annotatedPdfUrl: true, koordinatorSigUrl: true, koordinatorSignedPdfUrl: true, kaprodiSigUrl: true, finalPdfUrl: true },
    });
    const docList = await prisma.academicDocument.findMany({
      where: { matkulId: id },
      select: { fileUrl: true, annotatedPdfUrl: true, koordinatorSigUrl: true, koordinatorSignedPdfUrl: true, kaprodiSigUrl: true, finalPdfUrl: true },
    });
    const allUrls = [...rpsList, ...docList].flatMap(r => [
      r.fileUrl, r.annotatedPdfUrl, r.koordinatorSigUrl, r.koordinatorSignedPdfUrl, r.kaprodiSigUrl, r.finalPdfUrl,
    ]);
    await Promise.all(allUrls.map(url => unlinkIfExists(url)));

    await prisma.rPS.deleteMany({ where: { matkulId: id } });
    await prisma.academicDocument.deleteMany({ where: { matkulId: id } });

    await prisma.matkul.delete({ where: { id } });

    if (matkul) {
      const msg = `Mata kuliah ${matkul.code} - ${matkul.name} telah dihapus dari sistem.`;
      const affectedIds = [
        ...matkul.dosens.map(d => d.id),
        ...matkul.koordinators.map(k => k.id),
      ];
      if (affectedIds.length > 0) {
        await notifyUsers(affectedIds, msg).catch(() => {});
      }
      await notifyRole('KAPRODI', msg).catch(() => {});
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete matkul.' }, { status: 500 });
  }
}
