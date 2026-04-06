import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/change-requests/[id] - Approve or reject a MatkulChangeRequest
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action } = await req.json();

  const changeRequest = await prisma.matkulChangeRequest.findUnique({ where: { id } });
  if (!changeRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'approve') {
    // Apply the changes to the Matkul
    const updateData: Record<string, any> = {};
    if (changeRequest.proposedName) updateData.name = changeRequest.proposedName;
    if (changeRequest.proposedCode) updateData.code = changeRequest.proposedCode;
    if (changeRequest.proposedSks !== null) updateData.sks = changeRequest.proposedSks;

    await prisma.matkul.update({ where: { id: changeRequest.matkulId }, data: updateData });
  }

  const updated = await prisma.matkulChangeRequest.update({
    where: { id },
    data: { status: action === 'approve' ? 'APPROVED' : 'REJECTED' },
  });

  return NextResponse.json(updated);
}
