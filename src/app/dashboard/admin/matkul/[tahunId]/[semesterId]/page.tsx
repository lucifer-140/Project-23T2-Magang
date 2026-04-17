import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { MatkulClientPage } from '../../MatkulClientPage';

export default async function SemesterMatkulPage({
  params,
}: {
  params: Promise<{ tahunId: string; semesterId: string }>;
}) {
  const { tahunId, semesterId } = await params;

  const [semester, matkuls, dosens, koordinators] = await Promise.all([
    prisma.semester.findUnique({
      where: { id: semesterId },
      include: { tahunAkademik: true },
    }),
    prisma.matkul.findMany({
      where: { semesterId },
      include: {
        semester: { include: { tahunAkademik: true } },
        dosens: { select: { id: true, name: true, email: true } },
        koordinators: { select: { id: true, name: true, email: true } },
        classes: {
          orderBy: { name: 'asc' },
          include: { dosens: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { code: 'asc' },
    }),
    prisma.user.findMany({
      where: { roles: { has: 'DOSEN' } },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { roles: { has: 'KOORDINATOR' } },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!semester || semester.tahunAkademikId !== tahunId) notFound();

  return (
    <MatkulClientPage
      semester={semester}
      matkuls={matkuls}
      dosens={dosens}
      koordinators={koordinators}
    />
  );
}
