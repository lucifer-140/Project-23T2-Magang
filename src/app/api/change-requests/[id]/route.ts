import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

// PATCH /api/change-requests/[id] - Approve or reject a MatkulChangeRequest
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action } = await req.json();

  const changeRequest = await prisma.matkulChangeRequest.findUnique({
    where: { id },
    include: { katalogMatkul: { select: { code: true, name: true } } },
  });
  if (!changeRequest) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'approve') {
    const catalogUpdate: Record<string, unknown> = {};
    if (changeRequest.proposedName) catalogUpdate.name = changeRequest.proposedName;
    if (changeRequest.proposedCode) catalogUpdate.code = changeRequest.proposedCode;
    if (changeRequest.proposedSks !== null) catalogUpdate.sks = changeRequest.proposedSks;

    // Update catalog entry
    await prisma.katalogMatkul.update({
      where: { id: changeRequest.katalogMatkulId },
      data: catalogUpdate,
    });

    // Propagate to all semester instances linked to this catalog entry
    await prisma.matkul.updateMany({
      where: { katalogMatkulId: changeRequest.katalogMatkulId },
      data: catalogUpdate,
    });
  }

  const updated = await prisma.matkulChangeRequest.update({
    where: { id },
    data: { status: action === 'approve' ? 'APPROVED' : 'REJECTED' },
  });

  if (changeRequest.requestedById) {
    const matkulLabel = `${changeRequest.katalogMatkul.code} - ${changeRequest.katalogMatkul.name}`;
    const msg = action === 'approve'
      ? `Permintaan perubahan matkul ${matkulLabel} Anda telah disetujui.`
      : `Permintaan perubahan matkul ${matkulLabel} Anda ditolak.`;
    await createNotification(changeRequest.requestedById, msg, `/dashboard/kaprodi`);
  }

  return NextResponse.json(updated);
}
