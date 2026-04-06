import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/matkul/[id]/assign - Add or remove dosen from matkul
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { dosenId, action } = await req.json();

  try {
    const matkul = await prisma.matkul.update({
      where: { id },
      data: {
        dosens: action === 'add'
          ? { connect: { id: dosenId } }
          : { disconnect: { id: dosenId } },
      },
      include: { dosens: { select: { id: true, name: true, username: true } } },
    });
    return NextResponse.json(matkul);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
