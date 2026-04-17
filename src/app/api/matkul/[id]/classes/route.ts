import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/matkul/[id]/classes
// Body: { action: 'add' | 'remove', className: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matkulId } = await params;
  const { action, className } = await req.json();

  if (!className?.trim()) {
    return NextResponse.json({ error: 'className required' }, { status: 400 });
  }

  if (action === 'add') {
    const cls = await prisma.matkulClass.upsert({
      where: { matkulId_name: { matkulId, name: className.trim() } },
      create: { matkulId, name: className.trim() },
      update: {},
      include: { dosens: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(cls);
  }

  if (action === 'remove') {
    await prisma.matkulClass.deleteMany({
      where: { matkulId, name: className.trim() },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
