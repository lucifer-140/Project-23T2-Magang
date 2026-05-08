import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId, getRoles, unauthorized, forbidden } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  const roles = await getRoles();

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
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  const roles = await getRoles();
  if (!roles.includes('KAPRODI') && !roles.includes('ADMIN') && !roles.includes('MASTER')) return forbidden();

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
