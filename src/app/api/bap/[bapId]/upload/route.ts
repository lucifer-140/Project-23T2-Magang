import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import path from 'path';
import { writeFile } from 'fs/promises';
import { getUploadDir, sanitizeName, unlinkIfExists } from '@/lib/upload-paths';

// POST /api/bap/[bapId]/upload
// FormData: { slot: 'lembarKehadiran' | 'absensi' | 'beritaAcara', file: File }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bapId: string }> }
) {
  const { bapId } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bap = await prisma.beritaAcaraPerwalian.findUnique({ where: { id: bapId }, include: { kelas: true } });
  if (!bap) return NextResponse.json({ error: 'BAP not found' }, { status: 404 });
  if (bap.kelas.dosenPaId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (bap.status === 'APPROVED') return NextResponse.json({ error: 'BAP already approved' }, { status: 409 });

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const slot = formData.get('slot') as string;

  const validSlots = ['lembarKehadiran', 'absensi', 'beritaAcara'];
  if (!file || !validSlots.includes(slot)) {
    return NextResponse.json({ error: 'Invalid slot or missing file' }, { status: 400 });
  }

  const slotSubfolder: Record<string, string> = {
    lembarKehadiran: 'lembar-kehadiran',
    absensi: 'absensi',
    beritaAcara: 'berita-acara',
  };
  const subfolder = slotSubfolder[slot];
  const uploadDir = getUploadDir('bap', subfolder);

  // Unlink old file for this slot if it exists
  const oldUrl = bap[`${slot}Url` as keyof typeof bap] as string | null | undefined;
  await unlinkIfExists(oldUrl);

  const safeFileName = `${bapId}_${slot}_${sanitizeName(file.name)}`;
  await writeFile(path.join(uploadDir, safeFileName), Buffer.from(await file.arrayBuffer()));
  const fileUrl = `/uploads/bap/${subfolder}/${safeFileName}`;

  const updated = await prisma.beritaAcaraPerwalian.update({
    where: { id: bapId },
    data: {
      [`${slot}Url`]: fileUrl,
      [`${slot}Name`]: file.name,
      // auto-set status to SUBMITTED if all 3 slots are filled after this upload
    },
    include: { kelas: { include: { dosenPa: { select: { id: true, name: true } } } }, semester: { include: { tahunAkademik: true } } },
  });

  return NextResponse.json(updated);
}
