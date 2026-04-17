import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { TahunDetailClient } from './TahunDetailClient';

export default async function TahunDetailPage({
  params,
}: {
  params: Promise<{ tahunId: string }>;
}) {
  const { tahunId } = await params;

  const tahun = await prisma.tahunAkademik.findUnique({
    where: { id: tahunId },
    include: {
      semesters: {
        orderBy: { nama: 'asc' },
        include: { _count: { select: { matkuls: true } } },
      },
    },
  });

  if (!tahun) notFound();

  return <TahunDetailClient tahun={tahun} />;
}
