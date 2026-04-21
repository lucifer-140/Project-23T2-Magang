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

  if (!roles.includes('KAPRODI')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { dosenPaId } = await req.json();
  if (!dosenPaId) return NextResponse.json({ error: 'Missing dosenPaId' }, { status: 400 });

  const updated = await prisma.kelas.update({
    where: { id: kelasId },
    data: { dosenPaId },
    include: { dosenPa: { select: { id: true, name: true } } },
  });

  return NextResponse.json(updated);
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

  if (!roles.includes('KAPRODI')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.beritaAcaraPerwalian.deleteMany({ where: { kelasId } });
  await prisma.kelas.delete({ where: { id: kelasId } });

  return NextResponse.json({ ok: true });
}
