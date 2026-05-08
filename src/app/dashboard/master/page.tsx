import { prisma } from '@/lib/db';
import { Terminal, Users, BookOpen, FileText, Activity, Server, HardDrive, Zap, Database } from 'lucide-react';
import AutoRefresh from '@/components/AutoRefresh';
import path from 'path';
import fs from 'fs/promises';

async function getDiskStats() {
  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
  const byFolder: Record<string, { count: number; sizeBytes: number }> = {};
  let totalFiles = 0;
  let totalBytes = 0;

  async function scanDir(dir: string) {
    let items: string[];
    try { items = await fs.readdir(dir); } catch { return; }
    await Promise.all(items.map(async (item) => {
      const full = path.join(dir, item);
      const stat = await fs.stat(full).catch(() => null);
      if (!stat) return;
      if (stat.isDirectory()) {
        await scanDir(full);
      } else {
        const rel = path.relative(uploadsRoot, full).replace(/\\/g, '/');
        const folder = rel.split('/')[0];
        if (!byFolder[folder]) byFolder[folder] = { count: 0, sizeBytes: 0 };
        byFolder[folder].count++;
        byFolder[folder].sizeBytes += stat.size;
        totalFiles++;
        totalBytes += stat.size;
      }
    }));
  }

  await scanDir(uploadsRoot);
  return { byFolder, totalFiles, totalBytes };
}

async function getDbHealth() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: 0 };
  }
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const LOG_LEVEL_COLOR: Record<string, string> = {
  INFO:  'text-green-400',
  WARN:  'text-yellow-400',
  ERROR: 'text-red-400',
  DEBUG: 'text-gray-500',
};

export default async function MasterDashboard() {
  const [userCount, matkulCount, rpsCount, changeReqCount, errorCount] = await Promise.all([
    prisma.user.count(),
    prisma.matkul.count(),
    prisma.rPS.count(),
    prisma.matkulChangeRequest.count(),
    prisma.systemLog.count({ where: { level: 'ERROR' } }),
  ]);

  const [annotationCount, logCount, allUsers, recentLogs, diskStats, dbHealth] = await Promise.all([
    prisma.rpsAnnotation.count(),
    prisma.systemLog.count(),
    prisma.user.findMany({ select: { roles: true } }),
    prisma.systemLog.findMany({
      orderBy: { id: 'desc' },
      take: 10,
      select: { id: true, level: true, message: true, userId: true, route: true },
    }),
    getDiskStats(),
    getDbHealth(),
  ]);

  const roleCount: Record<string, number> = {};
  allUsers.forEach(u => u.roles.forEach(r => { roleCount[r] = (roleCount[r] || 0) + 1; }));
  const userStats = Object.entries(roleCount).map(([role, count]) => ({ role, count }));

  const mem = process.memoryUsage();
  const heapPct = Math.round((mem.heapUsed / mem.heapTotal) * 100);

  const latencyColor = dbHealth.latencyMs < 50
    ? 'text-green-400'
    : dbHealth.latencyMs < 200
      ? 'text-yellow-400'
      : 'text-red-400';

  const maxFolderBytes = Math.max(...Object.values(diskStats.byFolder).map(f => f.sizeBytes), 1);

  const dbTables = [
    { table: 'users',           count: userCount,      color: 'text-purple-400' },
    { table: 'matkul',          count: matkulCount,    color: 'text-blue-400' },
    { table: 'rps',             count: rpsCount,       color: 'text-green-400' },
    { table: 'change_requests', count: changeReqCount, color: 'text-yellow-400' },
    { table: 'rps_annotations', count: annotationCount,color: 'text-cyan-400' },
    { table: 'system_logs',     count: logCount,       color: 'text-gray-400' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
          <Terminal size={20} className="text-white" />
        </div>
        <h1 className="text-3xl font-playfair font-bold text-gray-100">System Monitor</h1>
      </div>
      <p className="text-gray-500 mb-8">Developer dashboard — real-time system health & database overview.</p>

      {/* DB Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Users',          value: userCount,      icon: <Users size={18} />,    color: 'text-purple-400 border-purple-900/50' },
          { label: 'Matkul',         value: matkulCount,    icon: <BookOpen size={18} />, color: 'text-blue-400 border-blue-900/50' },
          { label: 'RPS',            value: rpsCount,       icon: <FileText size={18} />, color: 'text-green-400 border-green-900/50' },
          { label: 'Change Requests',value: changeReqCount, icon: <Activity size={18} />, color: 'text-yellow-400 border-yellow-900/50' },
          { label: 'Errors Logged',  value: errorCount,     icon: <Zap size={18} />,      color: errorCount > 0 ? 'text-red-400 border-red-900/50' : 'text-gray-500 border-gray-800' },
        ].map(stat => (
          <div key={stat.label} className={`bg-gray-900 p-5 rounded-xl border ${stat.color.split(' ')[1]} font-mono`}>
            <div className={`flex items-center justify-between mb-2 ${stat.color.split(' ')[0]}`}>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{stat.label}</span>
              {stat.icon}
            </div>
            <p className={`text-3xl font-bold ${stat.color.split(' ')[0]}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Health + Disk row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* DB + Process Health */}
        <div className="bg-gray-900 rounded-2xl p-6 font-mono text-sm border border-gray-800">
          <div className="text-purple-400 mb-4 font-bold flex items-center gap-2">
            <Server size={14} /> System Health
          </div>
          <div className="space-y-2 text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-500">db.status</span>
              <span className={dbHealth.ok ? 'text-green-400' : 'text-red-400'}>
                {dbHealth.ok ? '● connected' : '● disconnected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">db.latency</span>
              <span className={latencyColor}>{dbHealth.latencyMs}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">heap.used</span>
              <span>{humanSize(mem.heapUsed)} / {humanSize(mem.heapTotal)}
                <span className={`ml-2 text-xs ${heapPct > 80 ? 'text-red-400' : 'text-gray-500'}`}>({heapPct}%)</span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">rss</span>
              <span>{humanSize(mem.rss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">uptime</span>
              <span>{Math.floor(process.uptime() / 60)}m {Math.floor(process.uptime() % 60)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">node</span>
              <span>{process.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">env</span>
              <span className="text-yellow-400">{process.env.NODE_ENV}</span>
            </div>
          </div>
        </div>

        {/* Disk Usage */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 font-mono">
          <div className="text-purple-400 mb-1 font-bold flex items-center gap-2 text-sm">
            <HardDrive size={14} /> Upload Storage
          </div>
          <p className="text-[11px] text-gray-500 mb-4">
            {diskStats.totalFiles} files · {humanSize(diskStats.totalBytes)} total
          </p>
          <div className="space-y-3">
            {Object.entries(diskStats.byFolder)
              .sort((a, b) => b[1].sizeBytes - a[1].sizeBytes)
              .map(([folder, info]) => (
                <div key={folder}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-green-400">{folder}/</span>
                    <span className="text-gray-500">{info.count} files · {humanSize(info.sizeBytes)}</span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.round((info.sizeBytes / maxFolderBytes) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* DB Table Overview */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 font-mono">
          <div className="text-purple-400 mb-4 font-bold flex items-center gap-2 text-sm">
            <Database size={14} /> DB Table Overview
          </div>
          <div className="space-y-1">
            {dbTables.map(({ table, count, color }) => (
              <div key={table} className="flex items-center justify-between py-1.5 border-b border-gray-800/60 last:border-0">
                <span className={`text-xs font-mono ${color}`}>{table}</span>
                <span className="text-xs font-bold text-gray-300 bg-gray-800 px-2 py-0.5 rounded">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Users by Role */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 font-mono">
          <div className="text-purple-400 mb-4 font-bold flex items-center gap-2 text-sm">
            <Users size={14} /> Users by Role
          </div>
          <div className="space-y-1">
            {userStats.map(stat => (
              <div key={stat.role} className="flex items-center justify-between py-1.5 border-b border-gray-800/60 last:border-0">
                <span className="text-xs font-mono text-green-400">{stat.role}</span>
                <span className="text-xs font-bold text-gray-300 bg-gray-800 px-2 py-0.5 rounded">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent System Events */}
      <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-3 bg-gray-900 border-b border-gray-800 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <Activity size={13} className="text-gray-500" />
          <span className="text-xs font-mono text-gray-400">system.log — last 10 events</span>
        </div>
        <div className="divide-y divide-gray-900">
          {recentLogs.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-600 font-mono text-sm">No events.</div>
          ) : (
            recentLogs.map(log => (
              <div key={log.id} className="px-6 py-2.5 flex items-center justify-between hover:bg-gray-900/40 font-mono text-xs">
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`font-bold w-12 flex-shrink-0 uppercase ${LOG_LEVEL_COLOR[log.level] ?? 'text-gray-500'}`}>
                    {log.level}
                  </span>
                  <span className="text-gray-300 truncate">{log.message}</span>
                  {log.route && (
                    <span className="text-[10px] text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded flex-shrink-0">{log.route}</span>
                  )}
                </div>
                {log.userId && <span className="text-green-400 flex-shrink-0 ml-4 text-[10px]">uid:{log.userId.slice(0,8)}</span>}
              </div>
            ))
          )}
        </div>
      </div>

      <AutoRefresh />
    </div>
  );
}
