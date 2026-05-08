import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId, getRoles, unauthorized, forbidden } from '@/lib/auth';
import type { ChangeRequest } from '@/lib/api-types';

export async function GET(_req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  const roles = await getRoles();
  if (!roles.includes('KAPRODI')) return forbidden();

  const rows = await prisma.matkulChangeRequest.findMany({
    include: {
      katalogMatkul: { select: { id: true, name: true, code: true, sks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const payload: ChangeRequest[] = rows.map((r) => ({
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
  }));

  return NextResponse.json(payload);
}
