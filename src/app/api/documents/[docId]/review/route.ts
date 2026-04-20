import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// PATCH /api/documents/[docId]/review
// Body: { reviewer: 'koordinator' | 'prodi' | 'kaprodi', action: 'approve' | 'reject', notes?: string }
// Workflow (all doc types): Koordinator → Prodi → Kaprodi
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const { reviewer, action, notes } = await req.json();

  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  const existingDoc = await prisma.academicDocument.findUnique({
    where: { id: docId },
    select: { isKoordinatorApproved: true, isProdiApproved: true },
  });
  if (!existingDoc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

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
        prodiNotes: null,
      };
    }
  } else if (reviewer === 'prodi') {
    if (!existingDoc.isKoordinatorApproved) {
      return NextResponse.json({ error: 'Koordinator must approve first' }, { status: 400 });
    }
    if (action === 'approve') {
      updateData = {
        isProdiApproved: true,
        prodiId: userId ?? null,
        status: 'PENGECEKAN',
        prodiNotes: null,
      };
    } else {
      updateData = {
        status: 'REVISION',
        isKoordinatorApproved: false,
        isProdiApproved: false,
        prodiNotes: notes ?? null,
      };
    }
  } else if (reviewer === 'kaprodi') {
    if (!existingDoc.isProdiApproved) {
      return NextResponse.json({ error: 'Prodi must approve first' }, { status: 400 });
    }
    if (action === 'approve') {
      updateData = {
        status: 'APPROVED',
        kaprodiId: userId ?? null,
      };
    } else {
      updateData = {
        status: 'REVISION',
        isKoordinatorApproved: false,
        isProdiApproved: false,
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
      isProdiApproved: true,
      koordinatorNotes: true,
      kaprodiNotes: true,
      prodiNotes: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(doc);
}
