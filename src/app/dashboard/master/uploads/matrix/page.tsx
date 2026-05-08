import { prisma } from '@/lib/db';
import { MatrixClient } from './MatrixClient';
import type { SemesterOption } from '@/lib/api-types';

export default async function MatrixPage() {
  const semesters = await prisma.semester.findMany({
    include: { tahunAkademik: true },
    orderBy: [{ tahunAkademik: { tahun: 'desc' } }, { nama: 'desc' }],
  });

  const options: SemesterOption[] = semesters.map(s => ({
    id:                s.id,
    nama:              s.nama,
    tahunAkademikId:   s.tahunAkademikId,
    tahunAkademikNama: s.tahunAkademik.tahun,
    isActive:          s.isActive,
  }));

  return <MatrixClient semesters={options} dark />;
}
