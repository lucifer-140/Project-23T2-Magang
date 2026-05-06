import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kelasId: string }> }
) {
  const { kelasId } = await params;
  const cookieStore = await cookies();
  if (!cookieStore.get('userId')?.value) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      dosenPa: { select: { id: true, name: true } },
      baps: {
        include: { semester: { include: { tahunAkademik: true } } },
        orderBy: [{ semester: { tahunAkademik: { tahun: 'desc' } } }, { semester: { nama: 'asc' } }],
      },
    },
  });

  if (!kelas) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(kelas);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ kelasId: string }> }
) {
  const { kelasId } = await params;
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const canManage = roles.includes('KAPRODI') || roles.includes('ADMIN') || roles.includes('MASTER');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.dosenPaId !== undefined) data.dosenPaId = body.dosenPaId;
  if (body.name !== undefined) data.name = body.name.trim().toUpperCase();
  if (body.isLocked !== undefined) data.isLocked = body.isLocked;

  try {
    const updated = await prisma.kelas.update({
      where: { id: kelasId },
      data,
      include: {
        dosenPa: { select: { id: true, name: true } },
        _count: { select: { baps: true, matkulClasses: true } },
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Nama kelas sudah digunakan' }, { status: 409 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ kelasId: string }> }
) {
  const { kelasId } = await params;
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const canManage = roles.includes('KAPRODI') || roles.includes('ADMIN') || roles.includes('MASTER');
  if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const inUse = await prisma.matkulClass.count({ where: { kelasId } });
  if (inUse > 0) {
    return NextResponse.json(
      { error: `Kelas ini digunakan di ${inUse} kelas mata kuliah dan tidak dapat dihapus` },
      { status: 409 }
    );
  }

  await prisma.beritaAcaraPerwalian.deleteMany({ where: { kelasId } });
  await prisma.kelas.delete({ where: { id: kelasId } });

  return NextResponse.json({ ok: true });
}
