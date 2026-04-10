import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { KoordinatorRPSClient } from './KoordinatorRPSClient';

export default async function KoordinatorRPSPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value ?? '';

  // Find all matkuls where this user is a koordinator
  const koordinatorMatkuls = await prisma.matkul.findMany({
    where: { koordinators: { some: { id: userId } } },
    select: { id: true },
  });
  const matkulIds = koordinatorMatkuls.map(m => m.id);

  // Fetch all RPS for those matkuls (only non-approved, needing koordinator attention)
  const submissions = await prisma.rPS.findMany({
    where: { matkulId: { in: matkulIds } },
    include: {
      matkul: { select: { name: true, code: true } },
      dosen: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Build full assignment list (dosen × matkul combos under this koordinator)
  const matkulsWithDosens = await prisma.matkul.findMany({
    where: { id: { in: matkulIds } },
    include: {
      dosens: { select: { id: true, name: true } },
      rps: true,
    },
  });

  const assignments: { dosenName: string; matkulName: string; rpsId: string | null; defaultStatus: string }[] = [];
  matkulsWithDosens.forEach(m => {
    m.dosens.forEach(d => {
      const rps = m.rps.find(r => r.dosenId === d.id);
      assignments.push({
        dosenName: d.name,
        matkulName: m.name,
        rpsId: rps?.id ?? null,
        defaultStatus: rps?.status ?? 'UNSUBMITTED',
      });
    });
  });

  return (
    <KoordinatorRPSClient
      submissions={submissions.map(s => ({
        id: s.id,
        matkulName: s.matkul.name,
        matkulCode: s.matkul.code,
        dosenName: s.dosen.name,
        status: s.status,
        isKoordinatorApproved: s.isKoordinatorApproved,
        fileName: s.fileName,
        fileUrl: s.fileUrl,
        koordinatorNotes: s.koordinatorNotes,
        kaprodiNotes: s.kaprodiNotes,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }))}
      assignments={assignments}
    />
  );
}
