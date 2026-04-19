import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

const PRODI_DOC_TYPES = ['LPP', 'EPP'];

// PATCH /api/documents/[docId]/review
// Body: { reviewer: 'koordinator' | 'kaprodi' | 'prodi', action: 'approve' | 'reject', notes?: string }
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
    select: { type: true, isKoordinatorApproved: true },
  });
  if (!existingDoc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const isProdiDoc = PRODI_DOC_TYPES.includes(existingDoc.type);

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
  } else if (reviewer === 'prodi' && isProdiDoc) {
    if (!existingDoc.isKoordinatorApproved) {
      return NextResponse.json({ error: 'Koordinator must approve first' }, { status: 400 });
    }
    if (action === 'approve') {
      updateData = {
        isProdiApproved: true,
        prodiId: userId ?? null,
        status: 'APPROVED',
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
  } else if (reviewer === 'kaprodi' && !isProdiDoc) {
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
    return NextResponse.json({ error: 'Invalid reviewer for this document type' }, { status: 400 });
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
