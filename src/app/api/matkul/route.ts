import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const INCLUDE_FULL = {
  dosens: { select: { id: true, name: true, email: true } },
  koordinators: { select: { id: true, name: true, email: true } },
  classes: {
    orderBy: { name: 'asc' as const },
    include: { dosens: { select: { id: true, name: true, email: true } } },
  },
};

// POST /api/matkul - Create new Matkul
export async function POST(req: NextRequest) {
  try {
    const { code, name, sks, semester, academicYear, classes } = await req.json();
    const matkul = await prisma.matkul.create({
      data: {
        code,
        name,
        sks: parseInt(sks),
        semester: semester ?? null,
        academicYear: academicYear ?? null,
        classes: classes?.length
          ? { create: (classes as string[]).map((n: string) => ({ name: n.trim() })) }
          : undefined,
      },
      include: INCLUDE_FULL,
    });
    return NextResponse.json(matkul, { status: 201 });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Kombinasi kode, semester, dan tahun akademik sudah digunakan.' }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// GET /api/matkul - List all Matkul
export async function GET() {
  const matkuls = await prisma.matkul.findMany({
    include: INCLUDE_FULL,
    orderBy: { code: 'asc' },
  });
  return NextResponse.json(matkuls);
}
