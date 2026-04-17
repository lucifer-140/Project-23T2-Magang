import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/tahun-akademik
export async function GET() {
  const items = await prisma.tahunAkademik.findMany({
    orderBy: { tahun: 'desc' },
    include: {
      semesters: {
        orderBy: { nama: 'asc' },
        include: { _count: { select: { matkuls: true } } },
      },
    },
  });
  return NextResponse.json(items);
}

// POST /api/tahun-akademik
export async function POST(req: NextRequest) {
  try {
    const { tahun, isActive } = await req.json();
    if (!tahun) return NextResponse.json({ error: 'tahun wajib diisi' }, { status: 400 });
    const item = await prisma.tahunAkademik.create({
      data: { tahun, isActive: isActive ?? false },
      include: { semesters: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'Tahun akademik ini sudah ada.' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
