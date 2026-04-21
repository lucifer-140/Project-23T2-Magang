import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// PATCH /api/bap/[bapId]/unlock — Kaprodi unlocks a BAP card and notifies Dosen PA
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ bapId: string }> }
) {
  const { bapId } = await params;
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  if (!roles.includes('KAPRODI')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const bap = await prisma.beritaAcaraPerwalian.findUnique({
    where: { id: bapId },
    include: { kelas: true, semester: { include: { tahunAkademik: true } } },
  });
  if (!bap) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (bap.isUnlocked) return NextResponse.json({ error: 'Already unlocked' }, { status: 409 });

  const [updated] = await prisma.$transaction([
    prisma.beritaAcaraPerwalian.update({
      where: { id: bapId },
      data: { isUnlocked: true },
    }),
    prisma.notification.create({
      data: {
        userId: bap.kelas.dosenPaId,
        message: `Kaprodi telah membuka akses BAP ${bap.semester.nama} ${bap.semester.tahunAkademik.tahun} untuk kelas ${bap.kelas.name}. Silakan upload dokumen.`,
        link: `/dashboard/berita-acara/${bapId}`,
      },
    }),
  ]);

  return NextResponse.json({ isUnlocked: updated.isUnlocked });
}
