import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// PATCH /api/bap/[bapId]/review
// Body: { reviewer: 'prodi' | 'kaprodi', action: 'approve' | 'reject', notes?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bapId: string }> }
) {
  const { bapId } = await params;
  const { reviewer, action, notes } = await req.json();

  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  const bap = await prisma.beritaAcaraPerwalian.findUnique({ where: { id: bapId } });
  if (!bap) return NextResponse.json({ error: 'BAP not found' }, { status: 404 });

  let updateData: Record<string, unknown>;

  if (reviewer === 'prodi') {
    if (bap.status !== 'SUBMITTED' && bap.status !== 'PENGECEKAN') {
      return NextResponse.json({ error: 'BAP not in reviewable state' }, { status: 400 });
    }
    if (action === 'approve') {
      updateData = { isProdiApproved: true, prodiId: userId, status: 'PENGECEKAN', prodiNotes: null };
    } else {
      updateData = { status: 'REVISION', isProdiApproved: false, prodiNotes: notes ?? null };
    }
  } else if (reviewer === 'kaprodi') {
    if (!bap.isProdiApproved) {
      return NextResponse.json({ error: 'Prodi must approve first' }, { status: 400 });
    }
    if (action === 'approve') {
      updateData = { status: 'APPROVED', finalApprovedAt: new Date() };
    } else {
      updateData = { status: 'REVISION', isProdiApproved: false, kaprodiNotes: notes ?? null };
    }
  } else {
    return NextResponse.json({ error: 'Invalid reviewer' }, { status: 400 });
  }

  const updated = await prisma.beritaAcaraPerwalian.update({
    where: { id: bapId },
    data: updateData,
  });

  return NextResponse.json(updated);
}
