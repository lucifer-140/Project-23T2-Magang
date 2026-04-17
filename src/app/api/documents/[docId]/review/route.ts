import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// PATCH /api/documents/[docId]/review
// Body: { reviewer: 'koordinator' | 'kaprodi', action: 'approve' | 'reject', notes?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const { reviewer, action, notes } = await req.json();

  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  let updateData: Record<string, unknown>;

  if (reviewer === 'koordinator') {
    if (action === 'approve') {
      updateData = {
        isKoordinatorApproved: true,
        koordinatorId: userId ?? null,
        status: 'PENGECEKAN',
        koordinatorNotes: null,
      };
    } else {
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
      updateData = {
        status: 'REVISION',
        isKoordinatorApproved: false,
        kaprodiNotes: notes ?? null,
      };
    }
  } else {
    return NextResponse.json({ error: 'Invalid reviewer' }, { status: 400 });
  }

  const doc = await prisma.academicDocument.update({
    where: { id: docId },
    data: updateData,
    select: {
      id: true,
      status: true,
      isKoordinatorApproved: true,
      koordinatorNotes: true,
      kaprodiNotes: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(doc);
}
