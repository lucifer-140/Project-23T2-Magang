import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import path from 'path';
import { writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

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

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  const safeFileName = `${Date.now()}_bap_${slot}_${bapId}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  await writeFile(path.join(uploadDir, safeFileName), Buffer.from(await file.arrayBuffer()));
  const fileUrl = `/uploads/${safeFileName}`;

  const updated = await prisma.beritaAcaraPerwalian.update({
    where: { id: bapId },
    data: {
      [`${slot}Url`]: fileUrl,
      [`${slot}Name`]: file.name,
      // auto-set status to SUBMITTED if all 3 slots are filled after this upload
    },
    include: { kelas: { include: { dosenPa: { select: { id: true, name: true } } } }, semester: { include: { tahunAkademik: true } } },
  });

  // Auto-submit if all 3 slots filled
  const allFilled = updated.lembarKehadiranUrl && updated.absensiUrl && updated.beritaAcaraUrl;
  if (allFilled && updated.status === 'UNSUBMITTED') {
    const submitted = await prisma.beritaAcaraPerwalian.update({
      where: { id: bapId },
      data: { status: 'SUBMITTED' },
      include: { kelas: { include: { dosenPa: { select: { id: true, name: true } } } }, semester: { include: { tahunAkademik: true } } },
    });
    return NextResponse.json(submitted);
  }

  return NextResponse.json(updated);
}
