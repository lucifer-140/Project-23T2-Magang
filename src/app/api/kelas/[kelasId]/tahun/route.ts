import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// POST /api/kelas/[kelasId]/tahun — add tahun akademik to kelas, auto-create 3 BAPs
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ kelasId: string }> }
) {
  const { kelasId } = await params;
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  if (!roles.includes('KAPRODI')) return NextResponse.json({ error: 'Only Kaprodi can add tahun' }, { status: 403 });

  const { tahunAkademikId } = await req.json();
  if (!tahunAkademikId) return NextResponse.json({ error: 'Missing tahunAkademikId' }, { status: 400 });

  const kelas = await prisma.kelas.findUnique({ where: { id: kelasId } });
  if (!kelas) return NextResponse.json({ error: 'Kelas not found' }, { status: 404 });

  const tahunAkademik = await prisma.tahunAkademik.findUnique({ where: { id: tahunAkademikId } });
  if (!tahunAkademik) return NextResponse.json({ error: 'Tahun akademik not found' }, { status: 404 });

  const semesters = await prisma.semester.findMany({
    where: { tahunAkademikId },
    include: { tahunAkademik: true },
  });

  if (semesters.length === 0) {
    return NextResponse.json({ error: 'Tahun akademik belum memiliki semester. Hubungi admin.' }, { status: 400 });
  }

  // Check if any BAP already exists for this kelas+tahun
  const existing = await prisma.beritaAcaraPerwalian.findFirst({
    where: { kelasId, semesterId: { in: semesters.map(s => s.id) } },
  });
  if (existing) return NextResponse.json({ error: 'Tahun akademik already added to this kelas' }, { status: 409 });

  const baps = await prisma.$transaction(
    semesters.map(s =>
      prisma.beritaAcaraPerwalian.create({
        data: { kelasId, semesterId: s.id },
        include: { semester: { include: { tahunAkademik: true } } },
      })
    )
  );

  return NextResponse.json(baps, { status: 201 });
}
