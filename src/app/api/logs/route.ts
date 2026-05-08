import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId, getRoles, unauthorized, forbidden } from '@/lib/auth';
import type { LogEntry } from '@/lib/api-types';

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

function systemLevelColor(level: string): string {
  switch (level) {
    case 'INFO':  return 'bg-green-100 text-green-700';
    case 'WARN':  return 'bg-yellow-100 text-yellow-700';
    case 'ERROR': return 'bg-red-100 text-red-700';
    default:      return 'bg-gray-100 text-gray-500';
  }
}

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  const roles = await getRoles();
  if (!roles.includes('MASTER')) return forbidden();

  const { searchParams } = req.nextUrl;
  const source = searchParams.get('source') ?? 'all';   // rps|cr|doc|bap|system|all
  const levelFilter = searchParams.get('level') ?? '';  // INFO|WARN|ERROR|DEBUG|''
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '200'), 500);

  const dateFilter = {
    ...(from ? { gte: new Date(from) } : {}),
    ...(to   ? { lte: new Date(to) }   : {}),
  };

  const [rpsLogs, changeRequestLogs, docLogs, bapLogs, systemLogs] = await Promise.all([
    (source === 'all' || source === 'rps') ? prisma.rPS.findMany({
      include: {
        matkul: { select: { code: true, name: true } },
        dosen: { select: { name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      where: from || to ? { updatedAt: dateFilter } : undefined,
      take: 100,
    }) : Promise.resolve([]),

    (source === 'all' || source === 'cr') ? prisma.matkulChangeRequest.findMany({
      include: { katalogMatkul: { select: { code: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
      where: from || to ? { updatedAt: dateFilter } : undefined,
      take: 50,
    }) : Promise.resolve([]),

    (source === 'all' || source === 'doc') ? prisma.academicDocument.findMany({
      include: {
        matkul: { select: { code: true, name: true } },
        dosen: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      where: from || to ? { updatedAt: dateFilter } : undefined,
      take: 100,
    }) : Promise.resolve([]),

    (source === 'all' || source === 'bap') ? prisma.beritaAcaraPerwalian.findMany({
      include: { kelas: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      where: from || to ? { updatedAt: dateFilter } : undefined,
      take: 50,
    }) : Promise.resolve([]),

    (source === 'all' || source === 'system') ? prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        ...(levelFilter ? { level: levelFilter as 'INFO' | 'WARN' | 'DEBUG' | 'ERROR' } : {}),
        ...(from || to ? { createdAt: dateFilter } : {}),
      },
      take: 200,
    }) : Promise.resolve([]),
  ]);

  const entries: LogEntry[] = [
    ...rpsLogs.map((r) => {
      const meta = getStatusMeta(r.status);
      return {
        id: `rps-${r.id}`,
        timestamp: r.updatedAt.toISOString(),
        level: meta.label,
        levelColor: meta.color,
        message: `RPS "${r.matkul.name}" (${r.matkul.code}) — status: ${r.status}`,
        actor: r.dosen.name,
        action: 'RPS_STATUS_UPDATE',
        source: 'rps',
        route: null,
        stack: null,
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
      message: `Change request "${c.katalogMatkul.name}" (${c.katalogMatkul.code}) — ${c.status}`,
      actor: 'Admin',
      action: 'CHANGE_REQUEST',
      source: 'cr',
      route: null,
      stack: null,
    })),

    ...docLogs.map((d) => {
      const meta = getStatusMeta(d.status);
      return {
        id: `doc-${d.id}`,
        timestamp: d.updatedAt.toISOString(),
        level: meta.label,
        levelColor: meta.color,
        message: `${d.type} "${d.matkul.name}" (${d.matkul.code}) — status: ${d.status}`,
        actor: d.dosen.name,
        action: 'DOC_STATUS_UPDATE',
        source: 'doc',
        route: null,
        stack: null,
      };
    }),

    ...bapLogs.map((b) => {
      const meta = getStatusMeta(b.status);
      return {
        id: `bap-${b.id}`,
        timestamp: b.updatedAt.toISOString(),
        level: meta.label,
        levelColor: meta.color,
        message: `BAP kelas "${b.kelas.name}" — status: ${b.status}`,
        actor: 'System',
        action: 'BAP_STATUS_UPDATE',
        source: 'bap',
        route: null,
        stack: null,
      };
    }),

    ...systemLogs.map((s) => ({
      id: `sys-${s.id}`,
      timestamp: s.createdAt.toISOString(),
      level: s.level,
      levelColor: systemLevelColor(s.level),
      message: s.message,
      actor: s.userId ?? 'System',
      action: 'SYSTEM',
      source: 'system',
      route: s.route,
      stack: s.stack,
    })),
  ]
    .filter((e) => !levelFilter || e.level === levelFilter)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);

  return NextResponse.json(entries);
}
