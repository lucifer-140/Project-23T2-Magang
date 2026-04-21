import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const isKaprodi = roles.includes('KAPRODI');
  const isProdi = roles.includes('PRODI');

  const kelas = await prisma.kelas.findMany({
    where: isKaprodi || isProdi ? {} : { dosenPaId: userId },
    include: {
      dosenPa: { select: { id: true, name: true } },
      _count: { select: { baps: true } },
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

  if (!roles.includes('KAPRODI')) {
    return NextResponse.json({ error: 'Only Kaprodi can create Kelas' }, { status: 403 });
  }

  const { name, dosenPaId } = await req.json();
  if (!name || !dosenPaId) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  try {
    const kelas = await prisma.kelas.create({
      data: { name, dosenPaId },
      include: { dosenPa: { select: { id: true, name: true } }, _count: { select: { baps: true } } },
    });
    return NextResponse.json(kelas, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Kelas name already exists' }, { status: 409 });
  }
}
