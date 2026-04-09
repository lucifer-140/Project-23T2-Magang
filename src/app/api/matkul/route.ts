import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/matkul - Create new Matkul
export async function POST(req: NextRequest) {
  try {
    const { code, name, sks } = await req.json();
    const matkul = await prisma.matkul.create({
      data: { code, name, sks: parseInt(sks) },
      include: { dosens: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json(matkul, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// GET /api/matkul - List all Matkul
export async function GET() {
  const matkuls = await prisma.matkul.findMany({
    include: { dosens: { select: { id: true, name: true, email: true } } },
    orderBy: { code: 'asc' },
  });
  return NextResponse.json(matkuls);
}
