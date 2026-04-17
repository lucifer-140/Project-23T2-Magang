import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import MatkulHubClient from './MatkulHubClient';

interface Props {
  params: Promise<{ matkulId: string }>;
  searchParams: Promise<{ semesterId?: string }>;
}

export default async function MatkulHubPage({ params, searchParams }: Props) {
  const { matkulId } = await params;
  const { semesterId } = await searchParams;

  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) redirect('/');

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const matkul = await prisma.matkul.findUnique({
    where: { id: matkulId },
    include: {
      dosens: { select: { id: true, name: true, email: true } },
      koordinators: { select: { id: true, name: true } },
    },
  });

  if (!matkul) redirect('/dashboard/matkul');

  const isKaprodi = roles.includes('KAPRODI');
  const isKoordinator = roles.includes('KOORDINATOR') && matkul.koordinators.some(k => k.id === userId);
  const isDosen = matkul.dosens.some(d => d.id === userId);

  if (!isKaprodi && !isKoordinator && !isDosen) redirect('/dashboard/matkul');

  const userRoles = [
    ...(isKaprodi ? ['kaprodi'] : []),
    ...(isKoordinator ? ['koordinator'] : []),
    ...(isDosen ? ['dosen'] : []),
  ];

  // Fetch semesters for selector
  const semesters = await prisma.semester.findMany({
    orderBy: [{ tahunAkademik: { tahun: 'desc' } }, { nama: 'asc' }],
    include: { tahunAkademik: true },
  });

  const activeSemester = semesterId
    ? semesters.find(s => s.id === semesterId) ?? semesters.find(s => s.isActive) ?? semesters[0]
    : semesters.find(s => s.isActive) ?? semesters[0];

  // Fetch initial documents
  const docs = activeSemester ? await prisma.academicDocument.findMany({
    where: {
      matkulId,
      semesterId: activeSemester.id,
      ...(isKaprodi || isKoordinator ? {} : { dosenId: userId }),
    },
    include: { dosen: { select: { id: true, name: true } } },
    orderBy: { updatedAt: 'desc' },
  }) : [];

  const serializedDocs = docs.map(d => ({
    ...d,
    createdAt: d.createdAt?.toISOString() ?? null,
    updatedAt: d.updatedAt?.toISOString() ?? null,
  }));

  return (
    <MatkulHubClient
      matkul={{ id: matkul.id, code: matkul.code, name: matkul.name, sks: matkul.sks }}
      dosens={matkul.dosens}
      initialDocs={serializedDocs}
      userRoles={userRoles}
      userId={userId}
      initialSemesterId={activeSemester?.id ?? null}
      semesters={semesters}
    />
  );
}
