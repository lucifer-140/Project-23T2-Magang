import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import MatkulListClient from './MatkulListClient';
import AutoRefresh from '@/components/AutoRefresh';

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

  const [dosenMatkuls, koordinatorMatkuls] = await Promise.all([
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
  ]);

  let kaprodiMatkuls: typeof dosenMatkuls = [];
  if (isKaprodi) {
    kaprodiMatkuls = await prisma.matkul.findMany({ include: semesterInclude, orderBy: { code: 'asc' } });
  }

  let prodiMatkuls: typeof dosenMatkuls = [];
  if (isProdi && !isKaprodi) {
    prodiMatkuls = await prisma.matkul.findMany({ include: semesterInclude, orderBy: { code: 'asc' } });
  }

  // Build per-matkulId map with userRoles
  const matkulMap = new Map<string, (typeof dosenMatkuls[0]) & { userRoles: string[] }>();
  for (const m of kaprodiMatkuls) {
    if (!matkulMap.has(m.id)) matkulMap.set(m.id, { ...m, userRoles: ['kaprodi'] });
    else if (!matkulMap.get(m.id)!.userRoles.includes('kaprodi')) matkulMap.get(m.id)!.userRoles.push('kaprodi');
  }
  for (const m of prodiMatkuls) {
    if (!matkulMap.has(m.id)) matkulMap.set(m.id, { ...m, userRoles: ['prodi'] });
    else if (!matkulMap.get(m.id)!.userRoles.includes('prodi')) matkulMap.get(m.id)!.userRoles.push('prodi');
  }
  for (const m of koordinatorMatkuls) {
    if (!matkulMap.has(m.id)) matkulMap.set(m.id, { ...m, userRoles: ['koordinator'] });
    else if (!matkulMap.get(m.id)!.userRoles.includes('koordinator')) matkulMap.get(m.id)!.userRoles.push('koordinator');
  }
  for (const m of dosenMatkuls) {
    if (!matkulMap.has(m.id)) matkulMap.set(m.id, { ...m, userRoles: ['dosen'] });
    else if (!matkulMap.get(m.id)!.userRoles.includes('dosen')) matkulMap.get(m.id)!.userRoles.push('dosen');
  }

  const matkulIds = Array.from(matkulMap.keys());
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

  // One row per matkul instance — older semesters (e.g. 2022/2023) are never hidden
  const matkuls = Array.from(matkulMap.values()).map(m => {
    const dc = dcMap.get(m.id) ?? {};
    const agg = {
      SUBMITTED:   dc.SUBMITTED   ?? 0,
      APPROVED:    dc.APPROVED    ?? 0,
      REVISION:    dc.REVISION    ?? 0,
      PENGECEKAN:  dc.PENGECEKAN  ?? 0,
      UNSUBMITTED: dc.UNSUBMITTED ?? 0,
      total: Object.values(dc).reduce((a, b) => a + b, 0),
    };
    return {
      id: m.katalogMatkulId ?? m.id,
      matkulId: m.id,
      code: m.code,
      name: m.name,
      sks: m.sks,
      userRoles: m.userRoles,
      semester: m.semester,
      dosens: m.dosens,
      koordinators: m.koordinators,
      classes: m.classes,
      docCounts: agg,
    };
  });

  return (
    <>
      <AutoRefresh />
      <MatkulListClient initialMatkuls={matkuls} initialFilter={filter} />
    </>
  );
}
