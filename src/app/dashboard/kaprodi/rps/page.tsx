import { prisma } from '@/lib/db';
import { KaprodiRPSClient } from './KaprodiRPSClient';

export default async function KaprodiRPSPage() {
  const submissions = await prisma.rPS.findMany({
    include: {
      matkul: { select: { name: true, code: true, sks: true } },
      dosen: { select: { name: true } },
      koordinator: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const dosensWithMatkuls = await prisma.user.findMany({
    where: { dosenMatkuls: { some: {} } },
    include: {
      dosenMatkuls: {
        include: { rps: true }
      }
    }
  });

  const initialAssignments: { dosenName: string; matkulName: string; rpsId: string | null; defaultStatus: string }[] = [];
  
  dosensWithMatkuls.forEach(d => {
    d.dosenMatkuls.forEach(m => {
      const rpsForDosen = m.rps.find(r => r.dosenId === d.id);
      initialAssignments.push({
        dosenName: d.name,
        matkulName: m.name,
        rpsId: rpsForDosen?.id || null,
        defaultStatus: rpsForDosen?.status || 'UNSUBMITTED'
      });
    });
  });

  return (
    <KaprodiRPSClient
      submissions={submissions.map(s => ({
        id: s.id,
        matkulName: s.matkul.name,
        matkulCode: s.matkul.code,
        dosenName: s.dosen.name,
        koordinatorName: s.koordinator?.name ?? null,
        status: s.status,
        isKoordinatorApproved: s.isKoordinatorApproved,
        fileName: s.fileName,
        fileUrl: s.fileUrl,
        koordinatorNotes: s.koordinatorNotes,
        kaprodiNotes: s.kaprodiNotes,
        koordinatorSignedPdfUrl: s.koordinatorSignedPdfUrl,
        finalPdfUrl: s.finalPdfUrl,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }))}
      assignments={initialAssignments.map(a => ({
        ...a,
        isKoordinatorApproved: submissions.find(s => s.id === a.rpsId)?.isKoordinatorApproved ?? false,
      }))}
    />
  );
}
