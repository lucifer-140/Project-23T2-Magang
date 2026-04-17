import { prisma } from '@/lib/db';
import { TahunAkademikClient } from './TahunAkademikClient';

export default async function MatkulPage() {
  const items = await prisma.tahunAkademik.findMany({
    orderBy: { tahun: 'desc' },
    include: {
      semesters: {
        orderBy: { nama: 'asc' },
        include: { _count: { select: { matkuls: true } } },
      },
    },
  });

  return <TahunAkademikClient items={items} />;
}
