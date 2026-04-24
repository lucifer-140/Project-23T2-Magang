import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// POST /api/matkul/[id]/classes/[classId]/assign
// Body: { dosenId: string, action: 'add' | 'remove' }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; classId: string }> }
) {
  const { id: matkulId, classId } = await params;
  const { dosenId, action } = await req.json();

  if (!dosenId || !action) {
    return NextResponse.json({ error: 'dosenId and action required' }, { status: 400 });
  }

  const cls = await prisma.matkulClass.findUnique({ where: { id: classId } });
  if (!cls || cls.matkulId !== matkulId) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 });
  }

  if (action === 'add') {
    // Add dosen to class
    await prisma.matkulClass.update({
      where: { id: classId },
      data: { dosens: { connect: { id: dosenId } } },
    });
    // Also ensure dosen is in matkul-level relation (for existing code compatibility)
    const matkul = await prisma.matkul.update({
      where: { id: matkulId },
      data: { dosens: { connect: { id: dosenId } } },
    });
    await createNotification(
      dosenId,
      `Anda telah ditugaskan sebagai Dosen untuk matkul ${matkul.code} - ${matkul.name} (Kelas ${cls.name}).`,
      `/dashboard/matkul/${matkulId}`,
    ).catch(() => {});
  } else if (action === 'remove') {
    // Remove dosen from this class
    await prisma.matkulClass.update({
      where: { id: classId },
      data: { dosens: { disconnect: { id: dosenId } } },
    });
    // Check if dosen still assigned to any other class in this matkul
    const otherClasses = await prisma.matkulClass.findFirst({
      where: { matkulId, dosens: { some: { id: dosenId } } },
    });
    // If no other class, remove from matkul-level relation too
    const matkul = await prisma.matkul.findUnique({ where: { id: matkulId } });
    if (!otherClasses) {
      await prisma.matkul.update({
        where: { id: matkulId },
        data: { dosens: { disconnect: { id: dosenId } } },
      });
    }
    if (matkul) {
      await createNotification(
        dosenId,
        `Anda telah dilepas dari penugasan matkul ${matkul.code} - ${matkul.name} (Kelas ${cls.name}).`,
      ).catch(console.error);
    }
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const updated = await prisma.matkulClass.findUnique({
    where: { id: classId },
    include: { dosens: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(updated);
}
