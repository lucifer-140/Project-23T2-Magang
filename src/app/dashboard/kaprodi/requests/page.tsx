import { prisma } from '@/lib/db';
import { ChangeRequestsClient } from './ChangeRequestsClient';

export default async function ChangeRequestsPage() {
  const requests = await prisma.matkulChangeRequest.findMany({
    include: {
      katalogMatkul: { select: { id: true, name: true, code: true, sks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <ChangeRequestsClient
      requests={requests.map(r => ({
        id: r.id,
        matkulId: r.katalogMatkulId,
        matkulName: r.katalogMatkul.name,
        matkulCode: r.katalogMatkul.code,
        currentSks: r.katalogMatkul.sks,
        proposedName: r.proposedName,
        proposedCode: r.proposedCode,
        proposedSks: r.proposedSks,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
