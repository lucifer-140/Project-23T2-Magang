import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/matkul/[id]/classes
// Body: { action: 'add', kelasId: string } | { action: 'remove', className: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matkulId } = await params;
  const body = await req.json();
  const { action } = body;

  if (action === 'add') {
    const { kelasId } = body;
    if (!kelasId) return NextResponse.json({ error: 'kelasId required' }, { status: 400 });

    const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
    if (!kelas) return NextResponse.json({ error: 'Kelas tidak ditemukan' }, { status: 404 });
    if (kelas.isLocked) return NextResponse.json({ error: 'Kelas terkunci dan tidak dapat dipilih' }, { status: 409 });

    const cls = await prisma.matkulClass.upsert({
      where: { matkulId_name: { matkulId, name: kelas.name } },
      create: { matkulId, name: kelas.name, kelasId },
      update: { kelasId },
      include: { dosens: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(cls);
  }

  if (action === 'remove') {
    const { className } = body;
    if (!className?.trim()) return NextResponse.json({ error: 'className required' }, { status: 400 });
    await prisma.matkulClass.deleteMany({ where: { matkulId, name: className.trim() } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
