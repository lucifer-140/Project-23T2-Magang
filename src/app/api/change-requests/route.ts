import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import type { ChangeRequest } from '@/lib/api-types';

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;

  let roles: string[] = [];
  try {
    if (roleRaw) {
      const decoded = decodeURIComponent(roleRaw);
      const parsed = JSON.parse(decoded);
      roles = Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (e) {
    roles = roleRaw ? [roleRaw] : [];
  }

  if (!roles.includes('KAPRODI')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await prisma.matkulChangeRequest.findMany({
    include: {
      matkul: { select: { id: true, name: true, code: true, sks: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const payload: ChangeRequest[] = rows.map((r) => ({
    id: r.id,
    matkulId: r.matkulId,
    matkulName: r.matkul.name,
    matkulCode: r.matkul.code,
    currentSks: r.matkul.sks,
    proposedName: r.proposedName,
    proposedCode: r.proposedCode,
    proposedSks: r.proposedSks,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json(payload);
}
