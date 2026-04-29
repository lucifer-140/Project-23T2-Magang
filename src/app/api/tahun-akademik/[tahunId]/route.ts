import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// DELETE /api/tahun-akademik/[tahunId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tahunId: string }> }
) {
  const { tahunId } = await params;
  try {
    const semesters = await prisma.semester.findMany({
      where: { tahunAkademikId: tahunId },
      include: { _count: { select: { matkuls: true } } },
    });
    const total = semesters.reduce((sum, s) => sum + s._count.matkuls, 0);
    if (total > 0) {
      return NextResponse.json(
        { error: `Tidak dapat dihapus — terdapat ${total} mata kuliah di tahun akademik ini.` },
        { status: 409 }
      );
    }
    await prisma.tahunAkademik.delete({ where: { id: tahunId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
