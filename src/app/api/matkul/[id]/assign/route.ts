import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/matkul/[id]/assign - Add or remove dosen from matkul
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { dosenId, action } = await req.json();

  if (!dosenId || !action) {
    return NextResponse.json({ error: 'dosenId and action required' }, { status: 400 });
  }

  try {
    if (action === 'add') {
      const matkul = await prisma.matkul.update({
        where: { id },
        data: { dosens: { connect: { id: dosenId } } },
        include: { dosens: { select: { id: true, name: true, email: true } } },
      });
      return NextResponse.json(matkul);
    }

    if (action === 'remove') {
      // Deep cleanup: disconnect dosen AND delete all their RPS records for this matkul
      const [, matkul] = await prisma.$transaction([
        prisma.rPS.deleteMany({
          where: { matkulId: id, dosenId },
        }),
        prisma.matkul.update({
          where: { id },
          data: { dosens: { disconnect: { id: dosenId } } },
          include: { dosens: { select: { id: true, name: true, email: true } } },
        }),
      ]);
      return NextResponse.json(matkul);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
