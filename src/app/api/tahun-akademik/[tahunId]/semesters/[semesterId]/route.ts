import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// PATCH /api/tahun-akademik/[tahunId]/semesters/[semesterId] — Admin toggles semester lock
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tahunId: string; semesterId: string }> }
) {
  const { semesterId } = await params;
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  if (!roles.includes('ADMIN') && !roles.includes('MASTER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { isActive } = await req.json();
  if (typeof isActive !== 'boolean') {
    return NextResponse.json({ error: 'isActive harus boolean' }, { status: 400 });
  }

  const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
  if (!semester) return NextResponse.json({ error: 'Semester not found' }, { status: 404 });

  const updated = await prisma.semester.update({
    where: { id: semesterId },
    data: { isActive },
    include: { _count: { select: { matkuls: true } } },
  });

  return NextResponse.json(updated);
}
