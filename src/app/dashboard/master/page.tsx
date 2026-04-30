import { prisma } from '@/lib/db';
import { Terminal, Database, Users, BookOpen, FileText, Activity, Server, Code } from 'lucide-react';
import AutoRefresh from '@/components/AutoRefresh';

export default async function MasterDashboard() {
  const [userCount, matkulCount, rpsCount, changeReqCount] = await Promise.all([
    prisma.user.count(),
    prisma.matkul.count(),
    prisma.rPS.count(),
    prisma.matkulChangeRequest.count(),
  ]);

  const rpsStats = await prisma.rPS.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const allUsers = await prisma.user.findMany({ select: { roles: true } });
  const roleCount: Record<string, number> = {};
  allUsers.forEach(u => {
    u.roles.forEach(r => {
      roleCount[r] = (roleCount[r] || 0) + 1;
    });
  });
  const userStats = Object.entries(roleCount).map(([role, count]) => ({ role, count }));

  const recentActivity = await prisma.rPS.findMany({
    include: { matkul: { select: { name: true } }, dosen: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
          <Terminal size={20} className="text-white" />
        </div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue">System Monitor</h1>
      </div>
      <p className="text-gray-500 mb-8">Developer dashboard - real-time system health & database overview.</p>

      {/* DB Stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Users', value: userCount, icon: <Users size={18} />, color: 'bg-purple-50 text-purple-600 border-purple-200' },
          { label: 'Matkul', value: matkulCount, icon: <BookOpen size={18} />, color: 'bg-blue-50 text-uph-blue border-blue-200' },
          { label: 'RPS', value: rpsCount, icon: <FileText size={18} />, color: 'bg-green-50 text-green-600 border-green-200' },
          { label: 'Change Requests', value: changeReqCount, icon: <Activity size={18} />, color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
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
                <span className="text-xs text-gray-400 ml-2">- {rps.dosen.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400">{rps.updatedAt.toISOString().substring(0, 10)}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${rps.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    rps.status === 'REVISION' ? 'bg-orange-100 text-orange-700' :
                      rps.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                  }`}>{rps.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="mt-6 bg-gray-900 rounded-2xl p-6 font-mono text-sm">
        <div className="text-purple-400 mb-3 font-bold flex items-center gap-2">
          <Server size={14} /> System Information
        </div>
        <div className="space-y-1 text-gray-300">
          <div><span className="text-gray-500">framework:    </span> Next.js v16</div>
          <div><span className="text-gray-500">orm:          </span> Prisma v7</div>
          <div><span className="text-gray-500">database:     </span> PostgreSQL (via Docker)</div>
          <div><span className="text-gray-500">node:         </span> {process.version}</div>
          <div><span className="text-gray-500">env:          </span> {process.env.NODE_ENV}</div>
          <div><span className="text-gray-500">timestamp:    </span> {new Date().toISOString()}</div>
        </div>
      </div>
      <AutoRefresh />
    </div>
  );
}
