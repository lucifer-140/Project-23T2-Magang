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

// POST /api/tahun-akademik/[tahunId]/semesters
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tahunId: string }> }
) {
  const { tahunId } = await params;
  try {
    const { nama, isActive } = await req.json();
    if (!nama || !VALID.includes(nama)) {
      return NextResponse.json({ error: 'nama harus Ganjil, Genap, atau Akselerasi' }, { status: 400 });
    }
    const semester = await prisma.semester.create({
      data: { tahunAkademikId: tahunId, nama, isActive: isActive ?? false },
      include: { _count: { select: { matkuls: true } } },
    });
    return NextResponse.json(semester, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Semester ini sudah ada di tahun akademik tersebut.' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
