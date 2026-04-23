import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import MatkulListClient from './MatkulListClient';

export default async function MatkulListPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams;
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

  const matkulIds = Array.from(map.keys());
  const docCountsRaw = matkulIds.length > 0
    ? await prisma.academicDocument.groupBy({
        by: ['matkulId', 'status'],
        where: { matkulId: { in: matkulIds } },
        _count: { id: true },
      })
    : [];

  const dcMap = new Map<string, Record<string, number>>();
  for (const row of docCountsRaw) {
    if (!dcMap.has(row.matkulId)) dcMap.set(row.matkulId, {});
    dcMap.get(row.matkulId)![row.status] = row._count.id;
  }

  const matkuls = Array.from(map.values()).map(m => {
    const dc = dcMap.get(m.id) ?? {};
    return {
      ...m,
      docCounts: {
        SUBMITTED: dc.SUBMITTED ?? 0,
        APPROVED: dc.APPROVED ?? 0,
        REVISION: dc.REVISION ?? 0,
        PENGECEKAN: dc.PENGECEKAN ?? 0,
        UNSUBMITTED: dc.UNSUBMITTED ?? 0,
        total: Object.values(dc).reduce((a, b) => a + b, 0),
      },
    };
  });

  return <MatkulListClient initialMatkuls={matkuls} semesters={semesters} initialFilter={filter} />;
}
