import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import BapDetailClient from './BapDetailClient';

export default async function BapDetailPage({ params }: { params: Promise<{ bapId: string }> }) {
  const { bapId } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) redirect('/');

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const bap = await prisma.beritaAcaraPerwalian.findUnique({
    where: { id: bapId },
    include: {
      kelas: { include: { dosenPa: { select: { id: true, name: true } } } },
      semester: { include: { tahunAkademik: true } },
    },
  });

  if (!bap) redirect('/dashboard/berita-acara');

  const isKaprodi = roles.includes('KAPRODI');
  const isProdi = roles.includes('PRODI');
  const isDosenPa = bap.kelas.dosenPaId === userId;

  if (!isKaprodi && !isProdi && !isDosenPa) redirect('/dashboard/berita-acara');

  return (
    <BapDetailClient
      bap={{
        ...bap,
        createdAt: bap.createdAt.toISOString(),
        updatedAt: bap.updatedAt.toISOString(),
        finalApprovedAt: bap.finalApprovedAt?.toISOString() ?? null,
        kelas: { ...bap.kelas },
      }}
      isKaprodi={isKaprodi}
      isProdi={isProdi}
      isDosenPa={isDosenPa}
    />
  );
}
