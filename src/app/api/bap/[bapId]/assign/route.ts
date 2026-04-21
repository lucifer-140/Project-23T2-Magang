import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// PATCH /api/bap/[bapId]/assign — Kaprodi reassigns Dosen PA
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bapId: string }> }
) {
  const { bapId } = await params;
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  if (!roles.includes('KAPRODI')) {
    return NextResponse.json({ error: 'Only Kaprodi can reassign Dosen PA' }, { status: 403 });
  }

  const { dosenPaId } = await req.json();
  if (!dosenPaId) return NextResponse.json({ error: 'Missing dosenPaId' }, { status: 400 });

  const bap = await prisma.beritaAcaraPerwalian.findUnique({ where: { id: bapId }, select: { kelasId: true } });
  if (!bap) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updatedKelas = await prisma.kelas.update({
    where: { id: bap.kelasId },
    data: { dosenPaId },
    include: { dosenPa: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ dosenPa: updatedKelas.dosenPa, dosenPaId: updatedKelas.dosenPaId });
}
