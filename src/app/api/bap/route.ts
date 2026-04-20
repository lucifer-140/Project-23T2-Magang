import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// GET /api/bap — list BAP entries
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const { searchParams } = new URL(req.url);
  const semesterId = searchParams.get('semesterId');

  const isKaprodi = roles.includes('KAPRODI');
  const isProdi = roles.includes('PRODI');

  const baps = await prisma.beritaAcaraPerwalian.findMany({
    where: {
      ...(semesterId ? { semesterId } : {}),
      ...(isKaprodi || isProdi ? {} : { dosenPaId: userId }),
    },
    include: {
      dosenPa: { select: { id: true, name: true } },
      semester: { include: { tahunAkademik: true } },
    },
    orderBy: [{ semesterId: 'desc' }, { kelasName: 'asc' }],
  });

  return NextResponse.json(baps);
}

// POST /api/bap — Kaprodi creates BAP entry
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  if (!roles.includes('KAPRODI')) {
    return NextResponse.json({ error: 'Only Kaprodi can create BAP entries' }, { status: 403 });
  }

  const { kelasName, semesterId, dosenPaId } = await req.json();
  if (!kelasName || !semesterId || !dosenPaId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const bap = await prisma.beritaAcaraPerwalian.create({
      data: { kelasName, semesterId, dosenPaId },
      include: { dosenPa: { select: { id: true, name: true } }, semester: { include: { tahunAkademik: true } } },
    });
    return NextResponse.json(bap, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Entry for this kelas+semester already exists' }, { status: 409 });
  }
}
