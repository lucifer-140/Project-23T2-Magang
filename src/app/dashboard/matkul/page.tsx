import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import MatkulListClient from './MatkulListClient';

export default async function MatkulListPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) redirect('/');

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const isKaprodi = roles.includes('KAPRODI');

  const [dosenMatkuls, koordinatorMatkuls] = await Promise.all([
    prisma.matkul.findMany({
      where: { dosens: { some: { id: userId } } },
      include: { dosens: { select: { id: true, name: true } }, koordinators: { select: { id: true, name: true } } },
      orderBy: { code: 'asc' },
    }),
    prisma.matkul.findMany({
      where: { koordinators: { some: { id: userId } } },
      include: { dosens: { select: { id: true, name: true } }, koordinators: { select: { id: true, name: true } } },
      orderBy: { code: 'asc' },
    }),
  ]);

  let kaprodiMatkuls: typeof dosenMatkuls = [];
  if (isKaprodi) {
    kaprodiMatkuls = await prisma.matkul.findMany({
      include: { dosens: { select: { id: true, name: true } }, koordinators: { select: { id: true, name: true } } },
      orderBy: { code: 'asc' },
    });
  }

  // Deduplicate + annotate userRoles
  const map = new Map<string, (typeof dosenMatkuls[0]) & { userRoles: string[] }>();
  for (const m of kaprodiMatkuls) {
    if (!map.has(m.id)) map.set(m.id, { ...m, userRoles: ['kaprodi'] });
    else if (!map.get(m.id)!.userRoles.includes('kaprodi')) map.get(m.id)!.userRoles.push('kaprodi');
  }
  for (const m of koordinatorMatkuls) {
    if (!map.has(m.id)) map.set(m.id, { ...m, userRoles: ['koordinator'] });
    else if (!map.get(m.id)!.userRoles.includes('koordinator')) map.get(m.id)!.userRoles.push('koordinator');
  }
  for (const m of dosenMatkuls) {
    if (!map.has(m.id)) map.set(m.id, { ...m, userRoles: ['dosen'] });
    else if (!map.get(m.id)!.userRoles.includes('dosen')) map.get(m.id)!.userRoles.push('dosen');
  }

  const matkuls = Array.from(map.values());

  return <MatkulListClient initialMatkuls={matkuls} />;
}
