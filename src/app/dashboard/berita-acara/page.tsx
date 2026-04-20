import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import BapListClient from './BapListClient';

export default async function BeritaAcaraPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) redirect('/');

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const isKaprodi = roles.includes('KAPRODI');
  const isProdi = roles.includes('PRODI');

  const [baps, semesters, dosens] = await Promise.all([
    prisma.beritaAcaraPerwalian.findMany({
      where: isKaprodi || isProdi ? {} : { dosenPaId: userId },
      include: {
        dosenPa: { select: { id: true, name: true } },
        semester: { include: { tahunAkademik: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.semester.findMany({
      orderBy: [{ tahunAkademik: { tahun: 'desc' } }, { nama: 'asc' }],
      include: { tahunAkademik: true },
    }),
    isKaprodi
      ? prisma.user.findMany({ where: { roles: { has: 'DOSEN' } }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
      : Promise.resolve([]),
  ]);

  const serialized = baps.map(b => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    finalApprovedAt: b.finalApprovedAt?.toISOString() ?? null,
  }));

  return (
    <BapListClient
      baps={serialized}
      semesters={semesters.map(s => ({ id: s.id, label: `${s.tahunAkademik.tahun} — ${s.nama}`, isActive: s.isActive }))}
      dosens={dosens}
      isKaprodi={isKaprodi}
      isProdi={isProdi}
      userId={userId}
    />
  );
}
