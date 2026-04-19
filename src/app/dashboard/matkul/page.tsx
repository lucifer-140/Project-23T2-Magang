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
  const isProdi = roles.includes('PRODI');

  const semesterInclude = {
    dosens: { select: { id: true, name: true } },
    koordinators: { select: { id: true, name: true } },
    semester: { include: { tahunAkademik: { select: { tahun: true } } } },
    classes: { select: { id: true, name: true } },
  };

  const [dosenMatkuls, koordinatorMatkuls, semesters] = await Promise.all([
    prisma.matkul.findMany({
      where: { dosens: { some: { id: userId } } },
      include: semesterInclude,
      orderBy: { code: 'asc' },
    }),
    prisma.matkul.findMany({
      where: { koordinators: { some: { id: userId } } },
      include: semesterInclude,
      orderBy: { code: 'asc' },
    }),
    prisma.semester.findMany({
      orderBy: [{ tahunAkademik: { tahun: 'desc' } }, { nama: 'asc' }],
      include: { tahunAkademik: { select: { tahun: true } } },
    }),
  ]);

  let kaprodiMatkuls: typeof dosenMatkuls = [];
  if (isKaprodi) {
    kaprodiMatkuls = await prisma.matkul.findMany({
      include: semesterInclude,
      orderBy: { code: 'asc' },
    });
  }

  let prodiMatkuls: typeof dosenMatkuls = [];
  if (isProdi && !isKaprodi) {
    prodiMatkuls = await prisma.matkul.findMany({
      include: semesterInclude,
      orderBy: { code: 'asc' },
    });
  }

  // Deduplicate + annotate userRoles
  const map = new Map<string, (typeof dosenMatkuls[0]) & { userRoles: string[] }>();
  for (const m of kaprodiMatkuls) {
    if (!map.has(m.id)) map.set(m.id, { ...m, userRoles: ['kaprodi'] });
    else if (!map.get(m.id)!.userRoles.includes('kaprodi')) map.get(m.id)!.userRoles.push('kaprodi');
  }
  for (const m of prodiMatkuls) {
    if (!map.has(m.id)) map.set(m.id, { ...m, userRoles: ['prodi'] });
    else if (!map.get(m.id)!.userRoles.includes('prodi')) map.get(m.id)!.userRoles.push('prodi');
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

  return <MatkulListClient initialMatkuls={matkuls} semesters={semesters} />;
}
