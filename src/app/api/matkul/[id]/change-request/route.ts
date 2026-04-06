import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST /api/matkul/[id]/change-request - Create change request for Kaprodi approval
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { proposedName, proposedCode, proposedSks, reason } = await req.json();

  try {
    const request = await prisma.matkulChangeRequest.create({
      data: {
        matkulId: id,
        proposedName: proposedName || null,
        proposedCode: proposedCode || null,
        proposedSks: proposedSks ? parseInt(proposedSks) : null,
        reason,
        status: 'PENDING',
      },
    });
    return NextResponse.json(request, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

// GET /api/matkul/[id]/change-request - Get all change requests for a matkul
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const requests = await prisma.matkulChangeRequest.findMany({
    where: { matkulId: id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(requests);
}
