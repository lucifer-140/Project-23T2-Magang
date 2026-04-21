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
      ...(isKaprodi || isProdi ? {} : { kelas: { dosenPaId: userId } }),
    },
    include: {
      kelas: { include: { dosenPa: { select: { id: true, name: true } } } },
      semester: { include: { tahunAkademik: true } },
    },
    orderBy: [{ semesterId: 'desc' }, { kelas: { name: 'asc' } }],
  });

  return NextResponse.json(baps);
}

