import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import KelasDetailClient from './KelasDetailClient';

export default async function KelasDetailPage({ params }: { params: Promise<{ kelasId: string }> }) {
  const { kelasId } = await params;
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) redirect('/');

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const isKaprodi = roles.includes('KAPRODI');
  const isProdi = roles.includes('PRODI');

  const kelas = await prisma.kelas.findUnique({
    where: { id: kelasId },
    include: {
      dosenPa: { select: { id: true, name: true } },
      baps: {
        include: { semester: { include: { tahunAkademik: true } } },
        orderBy: [{ semester: { tahunAkademik: { tahun: 'desc' } } }],
      },
    },
  });

  if (!kelas) redirect('/dashboard/berita-acara');
  if (!isKaprodi && !isProdi && kelas.dosenPaId !== userId) redirect('/dashboard/berita-acara');

  // Group BAPs by tahunAkademik
  const tahunMap = new Map<string, { tahunAkademik: { id: string; tahun: string; isActive: boolean }; bapCount: number }>();
  for (const bap of kelas.baps) {
    const ta = bap.semester.tahunAkademik;
    if (!tahunMap.has(ta.id)) tahunMap.set(ta.id, { tahunAkademik: ta, bapCount: 0 });
    tahunMap.get(ta.id)!.bapCount++;
  }
  const tahunList = Array.from(tahunMap.values());

  const [allTahun, dosens] = await Promise.all([
    prisma.tahunAkademik.findMany({ orderBy: { tahun: 'desc' } }),
    isKaprodi
      ? prisma.user.findMany({ where: { roles: { has: 'DOSEN' } }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
      : Promise.resolve([]),
  ]);
  const usedTahunIds = new Set(tahunList.map(t => t.tahunAkademik.id));
  const availableTahun = allTahun.filter(t => !usedTahunIds.has(t.id));

  return (
    <KelasDetailClient
      kelas={{ id: kelas.id, name: kelas.name, dosenPa: kelas.dosenPa, createdAt: kelas.createdAt.toISOString() }}
      tahunList={tahunList}
      availableTahun={availableTahun}
      dosens={dosens}
      isKaprodi={isKaprodi}
    />
  );
}
