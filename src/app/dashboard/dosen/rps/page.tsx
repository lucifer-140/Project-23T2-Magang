import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { DosenRPSClient } from './DosenRPSClient';

export default async function DosenRPSPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return <div className="text-red-500 p-8">Session tidak valid. Silahkan login ulang.</div>;
  }

  // Fetch all Matkul assigned to this dosen
  const assignedMatkuls = await prisma.matkul.findMany({
    where: { dosens: { some: { id: userId } } },
    include: {
      rps: {
        where: { dosenId: userId },
        select: { id: true, status: true, isKoordinatorApproved: true, fileName: true, fileUrl: true, notes: true, koordinatorNotes: true, kaprodiNotes: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { code: 'asc' },
  });

  const matkulRpsData = assignedMatkuls.map(m => ({
    matkulId: m.id,
    matkulCode: m.code,
    matkulName: m.name,
    sks: m.sks,
    rpsId: m.rps[0]?.id ?? null,
    status: (m.rps[0]?.status ?? 'UNSUBMITTED') as string,
    isKoordinatorApproved: m.rps[0]?.isKoordinatorApproved ?? false,
    fileName: m.rps[0]?.fileName ?? null,
    fileUrl: m.rps[0]?.fileUrl ?? null,
    notes: m.rps[0]?.notes ?? null,
    koordinatorNotes: m.rps[0]?.koordinatorNotes ?? null,
    kaprodiNotes: m.rps[0]?.kaprodiNotes ?? null,
    updatedAt: m.rps[0]?.updatedAt?.toISOString() ?? null,
  }));

  return <DosenRPSClient matkulRpsData={matkulRpsData} userId={userId} />;
}
