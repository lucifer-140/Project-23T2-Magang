import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { notifyUsers, notifyRole } from '@/lib/notifications';

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

    // Delete RPS related to this matkul first
    await prisma.rPS.deleteMany({ where: { matkulId: id } });
    
    // Delete the Matkul itself (disconnects dosens and koordinators automatically)
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
