import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import TahunDetailClient from './TahunDetailClient';

export default async function TahunDetailPage({
  params,
}: {
  params: Promise<{ kelasId: string; tahunAkademikId: string }>;
}) {
  const { kelasId, tahunAkademikId } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) redirect('/');

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const isKaprodi = roles.includes('KAPRODI');
  const isProdi = roles.includes('PRODI');

  const [kelas, tahunAkademik] = await Promise.all([
    prisma.kelas.findUnique({
      where: { id: kelasId },
      include: { dosenPa: { select: { id: true, name: true } } },
    }),
    prisma.tahunAkademik.findUnique({ where: { id: tahunAkademikId } }),
  ]);

  if (!kelas || !tahunAkademik) redirect(`/dashboard/berita-acara/kelas/${kelasId}`);
  if (!isKaprodi && !isProdi && kelas.dosenPaId !== userId) redirect('/dashboard/berita-acara');

  const baps = await prisma.beritaAcaraPerwalian.findMany({
    where: {
      kelasId,
      semester: { tahunAkademikId },
    },
    include: { semester: { include: { tahunAkademik: true } } },
    orderBy: { semester: { nama: 'asc' } },
  });

  return (
    <TahunDetailClient
      kelas={{ id: kelas.id, name: kelas.name, dosenPa: kelas.dosenPa }}
      tahunAkademik={tahunAkademik}
      baps={baps.map(b => ({
        ...b,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        finalApprovedAt: b.finalApprovedAt?.toISOString() ?? null,
      }))}
      isKaprodi={isKaprodi}
      isProdi={isProdi}
      isDosenPa={kelas.dosenPaId === userId}
    />
  );
}
