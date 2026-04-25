import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { notifyRole } from '@/lib/notifications';
import { Role } from '@prisma/client';

// POST /api/bap/[bapId]/submit — Dosen PA manually submits BAP for Kaprodi review
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ bapId: string }> }
) {
  const { bapId } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bap = await prisma.beritaAcaraPerwalian.findUnique({
    where: { id: bapId },
    include: { kelas: true, semester: { include: { tahunAkademik: true } } },
  });
  if (!bap) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (bap.kelas.dosenPaId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!bap.isUnlocked) return NextResponse.json({ error: 'Akses belum dibuka oleh Kaprodi' }, { status: 400 });
  if (bap.status === 'SUBMITTED' || bap.status === 'APPROVED') {
    return NextResponse.json({ error: 'BAP sudah diajukan atau disetujui' }, { status: 409 });
  }

  const allFilled = bap.lembarKehadiranUrl && bap.absensiUrl && bap.beritaAcaraUrl;
  if (!allFilled) return NextResponse.json({ error: 'Semua dokumen harus diupload terlebih dahulu' }, { status: 400 });

  const updated = await prisma.beritaAcaraPerwalian.update({
    where: { id: bapId },
    data: { status: 'SUBMITTED', kaprodiNotes: null },
    include: { kelas: { include: { dosenPa: { select: { id: true, name: true } } } }, semester: { include: { tahunAkademik: true } } },
  });

  const kelasName = updated.kelas.name;
  const semLabel = `${updated.semester.tahunAkademik.tahun} - ${updated.semester.nama}`;
  await notifyRole(Role.KAPRODI, `BAP kelas ${kelasName} (${semLabel}) telah diajukan dan menunggu persetujuan Kaprodi.`, `/dashboard/berita-acara/${bapId}`);

  return NextResponse.json(updated);
}
