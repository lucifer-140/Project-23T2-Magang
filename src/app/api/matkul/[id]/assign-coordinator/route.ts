import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { koordinatorId, action } = await req.json();

  if (!koordinatorId || !action) {
    return NextResponse.json({ error: 'koordinatorId and action required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: koordinatorId } });
  if (!user || !user.roles?.includes('KOORDINATOR')) {
    return NextResponse.json({ error: 'User is not a Koordinator' }, { status: 400 });
  }

  if (action === 'add') {
    const matkul = await prisma.matkul.update({
      where: { id },
      data: { koordinators: { connect: { id: koordinatorId } } },
    });
    await createNotification(koordinatorId, `Anda telah ditugaskan sebagai Koordinator untuk matkul ${matkul.code} - ${matkul.name}.`, `/dashboard/matkul/${id}`);
  } else if (action === 'remove') {
    const matkul = await prisma.matkul.update({
      where: { id },
      data: { koordinators: { disconnect: { id: koordinatorId } } },
    });
    await createNotification(koordinatorId, `Anda telah dilepas dari penugasan Koordinator untuk matkul ${matkul.code} - ${matkul.name}.`).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
