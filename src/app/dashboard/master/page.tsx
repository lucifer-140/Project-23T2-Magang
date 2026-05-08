import { prisma } from '@/lib/db';
import { Terminal, Database, Users, BookOpen, FileText, Activity, Server, HardDrive, Zap } from 'lucide-react';
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

export default async function MasterDashboard() {
  const [userCount, matkulCount, rpsCount, changeReqCount, errorCount] = await Promise.all([
    prisma.user.count(),
    prisma.matkul.count(),
    prisma.rPS.count(),
    prisma.matkulChangeRequest.count(),
    prisma.systemLog.count({ where: { level: 'ERROR' } }),
  ]);

  const [rpsStats, allUsers, recentActivity, diskStats, dbHealth] = await Promise.all([
    prisma.rPS.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.user.findMany({ select: { roles: true } }),
    prisma.rPS.findMany({
      include: { matkul: { select: { name: true } }, dosen: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 10,
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

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
          <Terminal size={20} className="text-white" />
        </div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue">System Monitor</h1>
      </div>
      <p className="text-gray-500 mb-8">Developer dashboard — real-time system health & database overview.</p>

      {/* DB Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Users', value: userCount, icon: <Users size={18} />, color: 'bg-purple-50 text-purple-600 border-purple-200' },
          { label: 'Matkul', value: matkulCount, icon: <BookOpen size={18} />, color: 'bg-blue-50 text-uph-blue border-blue-200' },
          { label: 'RPS', value: rpsCount, icon: <FileText size={18} />, color: 'bg-green-50 text-green-600 border-green-200' },
          { label: 'Change Requests', value: changeReqCount, icon: <Activity size={18} />, color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
          { label: 'Errors Logged', value: errorCount, icon: <Zap size={18} />, color: errorCount > 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200' },
        ].map(stat => (
          <div key={stat.label} className={`bg-white p-5 rounded-xl border ${stat.color} shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">{stat.label}</span>
              {stat.icon}
            </div>
            <p className="text-3xl font-playfair font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Health + Disk row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* DB + Process Health */}
        <div className="bg-gray-900 rounded-2xl p-6 font-mono text-sm">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
            <HardDrive size={14} /> Upload Storage
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            {diskStats.totalFiles} files · {humanSize(diskStats.totalBytes)} total
          </p>
          <div className="space-y-2">
            {Object.entries(diskStats.byFolder)
              .sort((a, b) => b[1].sizeBytes - a[1].sizeBytes)
              .map(([folder, info]) => (
                <div key={folder}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="font-mono text-gray-600">{folder}</span>
                    <span className="text-gray-400">{info.count} files · {humanSize(info.sizeBytes)}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full"
                      style={{ width: `${Math.round((info.sizeBytes / maxFolderBytes) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* RPS Status Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Database size={14} /> RPS Status Breakdown
          </h2>
          <div className="space-y-2">
            {rpsStats.map(stat => (
              <div key={stat.status} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-mono text-gray-600">{stat.status}</span>
                <span className="text-sm font-bold bg-gray-100 px-2 py-0.5 rounded">{stat._count.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Role Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={14} /> Users by Role
          </h2>
          <div className="space-y-2">
            {userStats.map(stat => (
              <div key={stat.role} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-mono text-gray-600">{stat.role}</span>
                <span className="text-sm font-bold bg-gray-100 px-2 py-0.5 rounded">{stat.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Activity size={16} className="text-purple-500" />
          <h2 className="text-sm font-bold text-gray-700">Recent RPS Activity (last 10)</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentActivity.map(rps => (
            <div key={rps.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50/50">
              <div>
                <span className="text-sm font-semibold text-gray-800">{rps.matkul.name}</span>
                <span className="text-xs text-gray-400 ml-2">— {rps.dosen.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400">{rps.updatedAt.toISOString().substring(0, 10)}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  rps.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  rps.status === 'REVISION'  ? 'bg-orange-100 text-orange-700' :
                  rps.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{rps.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AutoRefresh />
    </div>
  );
}
