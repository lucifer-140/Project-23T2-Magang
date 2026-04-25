import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import type { LogEntry } from '@/lib/api-types';

// Maps doc status to log level label + Tailwind color for the activity feed
function getStatusMeta(status: string): { label: string; color: string } {
  switch (status) {
    case 'APPROVED':
      return { label: 'INFO', color: 'bg-green-100 text-green-700' };
    case 'SUBMITTED':
    case 'PENGECEKAN':
      return { label: 'INFO', color: 'bg-blue-100 text-uph-blue' };
    case 'REVISION':
      return { label: 'WARN', color: 'bg-yellow-100 text-yellow-700' };
    case 'UNSUBMITTED':
      return { label: 'DEBUG', color: 'bg-gray-100 text-gray-500' };
    default:
      return { label: 'ERROR', color: 'bg-red-100 text-red-700' };
  }
}

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

  if (!roles.includes('MASTER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [rpsLogs, changeRequestLogs] = await Promise.all([
    prisma.rPS.findMany({
      include: {
        matkul: { select: { code: true, name: true } },
        dosen: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    }),
    prisma.matkulChangeRequest.findMany({
      include: { katalogMatkul: { select: { code: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }),
  ]);

  const entries: LogEntry[] = [
    ...rpsLogs.map((r) => {
      const meta = getStatusMeta(r.status);
      return {
        id: `rps-${r.id}`,
        timestamp: r.updatedAt.toISOString(),
        level: meta.label,
        levelColor: meta.color,
        message: `RPS "${r.matkul.name}" (${r.matkul.code}) - status diperbarui ke ${r.status}`,
        actor: r.dosen.name,
        action: 'RPS_STATUS_UPDATE',
      };
    }),
    ...changeRequestLogs.map((c) => ({
      id: `cr-${c.id}`,
      timestamp: c.updatedAt.toISOString(),
      level: c.status === 'APPROVED' ? 'INFO' : c.status === 'REJECTED' ? 'WARN' : 'DEBUG',
      levelColor:
        c.status === 'APPROVED'
          ? 'bg-green-100 text-green-700'
          : c.status === 'REJECTED'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-gray-100 text-gray-500',
      message: `Permintaan perubahan matkul "${c.katalogMatkul.name}" (${c.katalogMatkul.code}) - ${c.status}`,
      actor: 'Admin',
      action: 'CHANGE_REQUEST',
    })),
  ]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 120);

  return NextResponse.json(entries);
}
