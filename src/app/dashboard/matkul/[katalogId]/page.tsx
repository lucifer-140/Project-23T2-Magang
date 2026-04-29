import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import MatkulHubClient from './MatkulHubClient';
import AutoRefresh from '@/components/AutoRefresh';

interface Props {
  params: Promise<{ katalogId: string }>;
  searchParams: Promise<{ semesterId?: string }>;
}

function semOrder(tahun: string, nama: string): string {
  const ord = nama === 'Genap' ? '2' : nama === 'Ganjil' ? '1' : '0';
  return `${tahun}__${ord}`;
}

export default async function MatkulHubPage({ params, searchParams }: Props) {
  const { katalogId } = await params;
  const { semesterId: querySemesterId } = await searchParams;

  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const userName = cookieStore.get('userName')?.value ?? '';
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) redirect('/');

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const isKaprodi = roles.includes('KAPRODI');
  const isProdi = roles.includes('PRODI');

  const instanceInclude = {
    dosens: { select: { id: true, name: true, email: true } },
    koordinators: { select: { id: true, name: true } },
    classes: {
      include: { dosens: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' as const },
    },
    semester: { include: { tahunAkademik: true } },
  };

  // Fetch all Matkul instances for this katalog
  let instances = await prisma.matkul.findMany({
    where: { katalogMatkulId: katalogId },
    include: instanceInclude,
  });

  // Legacy fallback: katalogId is actually a matkulId
  if (instances.length === 0) {
    const legacy = await prisma.matkul.findUnique({
      where: { id: katalogId },
      include: instanceInclude,
    });
    if (legacy) instances = [legacy];
  }

  if (instances.length === 0) redirect('/dashboard/matkul');

  // Filter to instances where user has any access
  const accessibleInstances = instances.filter(m => {
    if (isKaprodi || isProdi) return true;
    const isKoord = roles.includes('KOORDINATOR') && m.koordinators.some(k => k.id === userId);
    const isDosen = m.dosens.some(d => d.id === userId);
    return isKoord || isDosen;
  });

  if (accessibleInstances.length === 0) redirect('/dashboard/matkul');

  // Sort instances latest-first
  accessibleInstances.sort((a, b) => {
    const ka = a.semester ? semOrder(a.semester.tahunAkademik.tahun, a.semester.nama) : '';
    const kb = b.semester ? semOrder(b.semester.tahunAkademik.tahun, b.semester.nama) : '';
    return kb.localeCompare(ka);
  });

  // Build instanceSemesters for client (includes dosens/koordinators/classes per instance)
  const instanceSemesters = accessibleInstances.map(m => {
    const isInstKaprodi = isKaprodi;
    const isInstProdi = isProdi;
    const isInstKoord = roles.includes('KOORDINATOR') && m.koordinators.some(k => k.id === userId);
    const isInstDosen = m.dosens.some(d => d.id === userId);
    const instRoles = [
      ...(isInstKaprodi ? ['kaprodi'] : []),
      ...(isInstKoord ? ['koordinator'] : []),
      ...(isInstProdi ? ['prodi'] : []),
      ...(isInstDosen ? ['dosen'] : []),
    ];
    return {
      semesterId: m.semesterId ?? '',
      label: m.semester
        ? `${m.semester.nama} ${m.semester.tahunAkademik.tahun}`
        : 'Tanpa Semester',
      matkulId: m.id,
      userRoles: instRoles,
      dosens: m.dosens,
      koordinators: m.koordinators,
      classes: m.classes.map(c => ({ id: c.id, name: c.name, dosens: c.dosens })),
    };
  });

  // Resolve active instance from semesterId query param
  const activeInst = querySemesterId
    ? (accessibleInstances.find(m => m.semesterId === querySemesterId) ?? accessibleInstances[0])
    : accessibleInstances[0];

  const activeInstSem = instanceSemesters.find(s => s.matkulId === activeInst.id)!;
  const activeUserRoles = activeInstSem.userRoles;
  const isWideReviewer = activeUserRoles.includes('kaprodi') || activeUserRoles.includes('koordinator') || activeUserRoles.includes('prodi');

  // Fetch initial docs for active instance
  const docs = activeInst.semesterId
    ? await prisma.academicDocument.findMany({
        where: {
          matkulId: activeInst.id,
          semesterId: activeInst.semesterId,
          ...(isWideReviewer ? {} : { dosenId: userId }),
        },
        include: { dosen: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
      })
    : [];

  const serializedDocs = docs.map(d => ({
    ...d,
    createdAt: d.createdAt?.toISOString() ?? null,
    updatedAt: d.updatedAt?.toISOString() ?? null,
  }));

  return (
    <>
      <MatkulHubClient
        katalogId={katalogId}
        matkul={{ code: activeInst.code, name: activeInst.name, sks: activeInst.sks }}
        initialDocs={serializedDocs}
        userRoles={activeUserRoles}
        userId={userId}
        userName={userName}
        initialSemesterId={activeInst.semesterId}
        instanceSemesters={instanceSemesters}
      />
      <AutoRefresh />
    </>
  );
}
