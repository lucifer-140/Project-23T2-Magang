import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// PATCH /api/rps/[id]/review
// Body: { reviewer: 'koordinator' | 'kaprodi', action: 'approve' | 'reject', notes?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { reviewer, action, notes } = await req.json();

  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  let updateData: Record<string, unknown>;

  if (reviewer === 'koordinator') {
    if (action === 'approve') {
      // Koordinator approves → mark approved and put back in SUBMITTED queue for Kaprodi
      updateData = {
        isKoordinatorApproved: true,
        koordinatorId: userId ?? null,
        status: 'SUBMITTED',
        koordinatorNotes: null,
      };
    } else {
      // Koordinator rejects → send back to dosen
      updateData = {
        status: 'REVISION',
        isKoordinatorApproved: false,
        koordinatorNotes: notes ?? null,
        kaprodiNotes: null,
      };
    }
  } else if (reviewer === 'kaprodi') {
    if (action === 'approve') {
      updateData = { status: 'APPROVED' };
    } else {
      // Kaprodi rejects → send back to dosen, reset koordinator approval so full chain reruns
      updateData = {
        status: 'REVISION',
        isKoordinatorApproved: false,
        kaprodiNotes: notes ?? null,
      };
    }
  } else {
    return NextResponse.json({ error: 'Invalid reviewer' }, { status: 400 });
  }

  const rps = await prisma.rPS.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      status: true,
      isKoordinatorApproved: true,
      notes: true,
      koordinatorNotes: true,
      kaprodiNotes: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(rps);
}
