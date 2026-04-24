import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

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

  let result: object;
  try {
    if (action === 'add') {
      result = await prisma.matkul.update({
        where: { id },
        data: { dosens: { connect: { id: dosenId } } },
        include: { dosens: { select: { id: true, name: true, email: true } } },
      });
    } else if (action === 'remove') {
      // Deep cleanup: disconnect dosen AND delete all their RPS records for this matkul
      const [, matkul] = await prisma.$transaction([
        prisma.rPS.deleteMany({ where: { matkulId: id, dosenId } }),
        prisma.matkul.update({
          where: { id },
          data: { dosens: { disconnect: { id: dosenId } } },
          include: { dosens: { select: { id: true, name: true, email: true } } },
        }),
      ]);
      result = matkul;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  if (action === 'add') {
    const matkul = result as { code: string; name: string };
    await createNotification(dosenId, `Anda telah ditugaskan sebagai Dosen untuk matkul ${matkul.code} - ${matkul.name}.`, `/dashboard/matkul/${id}`).catch(console.error);
  } else if (action === 'remove') {
    const matkul = result as { code: string; name: string };
    await createNotification(dosenId, `Anda telah dilepas dari penugasan matkul ${matkul.code} - ${matkul.name}.`).catch(console.error);
  }

  return NextResponse.json(result);
}
