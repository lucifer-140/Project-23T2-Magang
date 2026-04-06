import { prisma } from '@/lib/db';
import { KaprodiRPSClient } from './KaprodiRPSClient';

export default async function KaprodiRPSPage() {
  const submissions = await prisma.rPS.findMany({
    include: {
      matkul: { select: { name: true, code: true, sks: true } },
      dosen: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Group by dosen
  const dosenMap = new Map<string, { name: string; matkuls: { matkulName: string; status: string }[] }>();
  for (const rps of submissions) {
    const dosenName = rps.dosen.name;
    if (!dosenMap.has(dosenName)) dosenMap.set(dosenName, { name: dosenName, matkuls: [] });
    dosenMap.get(dosenName)!.matkuls.push({ matkulName: rps.matkul.name, status: rps.status });
  }

  return (
    <KaprodiRPSClient
      submissions={submissions.map(s => ({
        id: s.id,
        matkulName: s.matkul.name,
        matkulCode: s.matkul.code,
        dosenName: s.dosen.name,
        status: s.status,
        fileName: s.fileName,
        fileUrl: s.fileUrl,
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }))}
      dosenGroups={Array.from(dosenMap.values()).map(d => ({
        name: d.name,
        totalMatkul: d.matkuls.length,
        approved: d.matkuls.filter(m => m.status === 'APPROVED').length,
        progress: Math.round((d.matkuls.filter(m => m.status === 'APPROVED').length / d.matkuls.length) * 100),
        courses: d.matkuls,
      }))}
    />
  );
}
