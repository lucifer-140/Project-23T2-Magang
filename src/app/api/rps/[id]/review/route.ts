import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/rps/[id]/review - Approve or reject an RPS submission
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action, notes } = await req.json();

  const newStatus = action === 'approve' ? 'APPROVED' : 'REVISION';

  const rps = await prisma.rPS.update({
    where: { id },
    data: {
      status: newStatus,
      notes: action === 'reject' ? notes : null,
    },
    select: { id: true, status: true, notes: true, updatedAt: true },
  });

  return NextResponse.json(rps);
}
