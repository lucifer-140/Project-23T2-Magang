import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const VALID = ['Ganjil', 'Genap', 'Akselerasi'];

// GET /api/tahun-akademik/[tahunId]/semesters
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tahunId: string }> }
) {
  const { tahunId } = await params;
  const semesters = await prisma.semester.findMany({
    where: { tahunAkademikId: tahunId },
    orderBy: { nama: 'asc' },
    include: { _count: { select: { matkuls: true } } },
  });
  return NextResponse.json(semesters);
}

// POST removed — semesters are auto-created when TahunAkademik is created
export async function POST() {
  return NextResponse.json({ error: 'Semester dibuat otomatis saat tahun akademik dibuat.' }, { status: 405 });
}
