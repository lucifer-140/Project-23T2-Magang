import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

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

  const bap = await prisma.beritaAcaraPerwalian.findUnique({
    where: { id: bapId },
    include: { kelas: true, semester: { include: { tahunAkademik: true } } },
  });
  if (!bap) return NextResponse.json({ error: 'BAP not found' }, { status: 404 });

  let updateData: Record<string, unknown>;

  if (reviewer === 'kaprodi') {
    if (bap.status !== 'SUBMITTED') {
      return NextResponse.json({ error: 'BAP not in reviewable state' }, { status: 400 });
    }
    if (action === 'approve') {
      updateData = { status: 'APPROVED', finalApprovedAt: new Date() };
    } else {
      updateData = { status: 'REVISION', kaprodiNotes: notes ?? null };
    }
  } else {
    return NextResponse.json({ error: 'Invalid reviewer' }, { status: 400 });
  }

  const updated = await prisma.beritaAcaraPerwalian.update({
    where: { id: bapId },
    data: updateData,
  });

  const kelasName = bap.kelas.name;
  const semLabel = `${bap.semester.tahunAkademik.tahun} - ${bap.semester.nama}`;
  const bapLink = `/dashboard/berita-acara/${bapId}`;
  const dosenPaId = bap.kelas.dosenPaId;

  if (action === 'approve') {
    await createNotification(dosenPaId, `BAP kelas ${kelasName} (${semLabel}) telah disetujui Kaprodi!`, bapLink);
  } else {
    await createNotification(dosenPaId, `BAP kelas ${kelasName} (${semLabel}) dikembalikan untuk revisi oleh Kaprodi.`, bapLink);
  }

  return NextResponse.json(updated);
}
