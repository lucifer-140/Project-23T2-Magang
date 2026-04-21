import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import KelasListClient from './KelasListClient';

export default async function BeritaAcaraPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) redirect('/');

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const isKaprodi = roles.includes('KAPRODI');
  const isProdi = roles.includes('PRODI');

  const [kelasList, dosens] = await Promise.all([
    prisma.kelas.findMany({
      where: isKaprodi || isProdi ? {} : { dosenPaId: userId },
      include: {
        dosenPa: { select: { id: true, name: true } },
        _count: { select: { baps: true } },
      },
      orderBy: { name: 'asc' },
    }),
    isKaprodi
      ? prisma.user.findMany({ where: { roles: { has: 'DOSEN' } }, select: { id: true, name: true }, orderBy: { name: 'asc' } })
      : Promise.resolve([]),
  ]);

  return (
    <KelasListClient
      kelasList={kelasList.map(k => ({ ...k, createdAt: k.createdAt.toISOString() }))}
      dosens={dosens}
      isKaprodi={isKaprodi}
      isProdi={isProdi}
      userId={userId}
    />
  );
}
