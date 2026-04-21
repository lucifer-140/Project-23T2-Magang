import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// DELETE /api/kelas/[kelasId]/tahun/[tahunAkademikId] — remove all BAPs for this kelas+tahun
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ kelasId: string; tahunAkademikId: string }> }
) {
  const { kelasId, tahunAkademikId } = await params;
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  if (!roles.includes('KAPRODI')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const semesters = await prisma.semester.findMany({ where: { tahunAkademikId }, select: { id: true } });
  const semesterIds = semesters.map(s => s.id);

  await prisma.beritaAcaraPerwalian.deleteMany({
    where: { kelasId, semesterId: { in: semesterIds } },
  });

  return NextResponse.json({ ok: true });
}
