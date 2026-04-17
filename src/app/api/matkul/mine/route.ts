import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// GET /api/matkul/mine
// Returns all matkuls where caller is dosen, koordinator, or kaprodi (union, deduplicated)
// Each matkul includes a `userRoles` field: ['dosen'] | ['koordinator'] | ['kaprodi'] | combinations
export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const isKaprodi = roles.includes('KAPRODI');

  const semesterInclude = {
    dosens: { select: { id: true, name: true } },
    koordinators: { select: { id: true, name: true } },
    semester: { include: { tahunAkademik: { select: { tahun: true } } } },
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
    kaprodiMatkuls = await prisma.matkul.findMany({
      include: semesterInclude,
      orderBy: { code: 'asc' },
    });
  }

  const map = new Map<string, (typeof dosenMatkuls[0]) & { userRoles: string[] }>();

  for (const m of kaprodiMatkuls) {
    if (!map.has(m.id)) map.set(m.id, { ...m, userRoles: ['kaprodi'] });
    else map.get(m.id)!.userRoles.push('kaprodi');
  }
  for (const m of koordinatorMatkuls) {
    if (!map.has(m.id)) map.set(m.id, { ...m, userRoles: ['koordinator'] });
    else if (!map.get(m.id)!.userRoles.includes('koordinator')) map.get(m.id)!.userRoles.push('koordinator');
  }
  for (const m of dosenMatkuls) {
    if (!map.has(m.id)) map.set(m.id, { ...m, userRoles: ['dosen'] });
    else if (!map.get(m.id)!.userRoles.includes('dosen')) map.get(m.id)!.userRoles.push('dosen');
  }

  return NextResponse.json(Array.from(map.values()));
}
