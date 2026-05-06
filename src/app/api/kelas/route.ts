import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const isKaprodi = roles.includes('KAPRODI');
  const isProdi = roles.includes('PRODI');
  const isAdmin = roles.includes('ADMIN') || roles.includes('MASTER');

  const { searchParams } = new URL(req.url);
  const lockedParam = searchParams.get('locked');

  const where: Record<string, unknown> = isKaprodi || isProdi || isAdmin ? {} : { dosenPaId: userId };
  if (lockedParam === 'false') where.isLocked = false;
  if (lockedParam === 'true') where.isLocked = true;

  const kelas = await prisma.kelas.findMany({
    where,
    include: {
      dosenPa: { select: { id: true, name: true } },
      _count: { select: { baps: true, matkulClasses: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(kelas);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const canManage = roles.includes('KAPRODI') || roles.includes('ADMIN') || roles.includes('MASTER');
  if (!canManage) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { name, dosenPaId } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Missing name' }, { status: 400 });

  try {
    const kelas = await prisma.kelas.create({
      data: { name: name.trim().toUpperCase(), ...(dosenPaId ? { dosenPaId } : {}) },
      include: {
        dosenPa: { select: { id: true, name: true } },
        _count: { select: { baps: true, matkulClasses: true } },
      },
    });
    return NextResponse.json(kelas, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Nama kelas sudah digunakan' }, { status: 409 });
  }
}
