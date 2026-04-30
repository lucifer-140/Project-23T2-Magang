import { prisma } from '@/lib/db';
import {
  BookOpen, Users, Bell, AlertTriangle, CheckCircle,
  UserCheck, ChevronRight, Activity, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import AutoRefresh from '@/components/AutoRefresh';

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'kemarin' : `${d}h lalu`;
}

export default async function AdminDashboard() {
  const [
    totalMatkul,
    totalUsers,
    pendingChangeReq,
    pendingUserApprovals,
    matkulNoKoor,
    matkulNoDosen,
  ] = await Promise.all([
    prisma.matkul.count(),
    prisma.user.count({ where: { roles: { hasSome: ['DOSEN', 'KOORDINATOR'] }, status: 'ACTIVE' } }),
    prisma.matkulChangeRequest.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.matkul.count({ where: { koordinators: { none: {} } } }),
    prisma.matkul.count({ where: { dosens: { none: {} } } }),
  ]);

  // Coverage table — incomplete matkuls first
  const incompleteMatkuls = await prisma.matkul.findMany({
    where: { OR: [{ koordinators: { none: {} } }, { dosens: { none: {} } }] },
    include: {
      koordinators: { select: { name: true } },
      dosens: { select: { id: true } },
    },
    take: 6,
    orderBy: { name: 'asc' },
  });

  // Recent activity: last 5 users + last 5 change requests merged by date
  const [recentUsers, recentChangeReqs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { id: 'desc' },
      take: 5,
      select: { name: true, status: true, roles: true },
    }),
    prisma.matkulChangeRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { katalogMatkul: { select: { name: true, code: true } } },
    }),
  ]);

  type ActivityItem =
    | { kind: 'user'; name: string; status: string; roles: string[]; date: Date | null }
    | { kind: 'cr'; matkulName: string; matkulCode: string; status: string; date: Date };

  const activity: ActivityItem[] = [
    ...recentUsers.map(u => ({ kind: 'user' as const, name: u.name, status: u.status, roles: u.roles, date: null as Date | null })),
    ...recentChangeReqs.map(cr => ({ kind: 'cr' as const, matkulName: cr.katalogMatkul.name, matkulCode: cr.katalogMatkul.code, status: cr.status, date: cr.createdAt })),
  ].slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Dashboard Admin</h1>
        <p className="text-gray-500">Kelola mata kuliah, pengguna, dan konfigurasi sistem akademik.</p>
      </div>

      {/* ── Alert Banners ───────────────────────────────────────────────── */}
      {(pendingUserApprovals > 0 || pendingChangeReq > 0) && (
        <div className="space-y-2">
          {pendingUserApprovals > 0 && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-amber-800">
                  {pendingUserApprovals} akun menunggu persetujuan
                </p>
              </div>
              <Link href="/dashboard/admin/approvals"
                className="flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline flex-shrink-0">
                Tinjau Sekarang <ArrowRight size={12} />
              </Link>
            </div>
          )}
          {pendingChangeReq > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
              <div className="flex items-center gap-2.5">
                <Bell size={16} className="text-blue-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-blue-800">
                  {pendingChangeReq} permintaan perubahan matkul belum diproses
                </p>
              </div>
              <Link href="/dashboard/admin/matkul"
                className="flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline flex-shrink-0">
                Tinjau <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Stat Grid 2×3 ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Matkul',        value: totalMatkul,         sub: 'Mata kuliah terdaftar',       color: 'border-l-uph-blue',   icon: <BookOpen   size={18} className="text-uph-blue opacity-60"   />, urgent: false },
          { label: 'Pengguna Aktif',       value: totalUsers,          sub: 'Dosen & Koordinator',         color: 'border-l-teal-500',   icon: <Users      size={18} className="text-teal-500 opacity-60"   />, urgent: false },
          { label: 'Change Req. Pending',  value: pendingChangeReq,    sub: 'Perubahan matkul',            color: pendingChangeReq   > 0 ? 'border-l-blue-500'   : 'border-l-gray-200', icon: <Bell       size={18} className={pendingChangeReq   > 0 ? 'text-blue-500'   : 'text-gray-300'} />, urgent: pendingChangeReq   > 0 },
          { label: 'Persetujuan Pending',  value: pendingUserApprovals, sub: 'Akun menunggu konfirmasi',   color: pendingUserApprovals > 0 ? 'border-l-amber-500'  : 'border-l-gray-200', icon: <UserCheck  size={18} className={pendingUserApprovals > 0 ? 'text-amber-500'  : 'text-gray-300'} />, urgent: pendingUserApprovals > 0 },
          { label: 'Matkul Tanpa Koor.',   value: matkulNoKoor,        sub: 'Koordinator belum ditetapkan', color: matkulNoKoor       > 0 ? 'border-l-red-400'    : 'border-l-gray-200', icon: <AlertTriangle size={18} className={matkulNoKoor       > 0 ? 'text-red-400'    : 'text-gray-300'} />, urgent: matkulNoKoor       > 0 },
          { label: 'Matkul Tanpa Dosen',   value: matkulNoDosen,       sub: 'Dosen belum ditugaskan',      color: matkulNoDosen      > 0 ? 'border-l-red-400'    : 'border-l-gray-200', icon: <AlertTriangle size={18} className={matkulNoDosen      > 0 ? 'text-red-400'    : 'text-gray-300'} />, urgent: matkulNoDosen      > 0 },
        ].map(s => (
          <div key={s.label} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 ${s.color} ${s.urgent ? 'ring-1 ring-inset ring-red-100' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">{s.label}</h3>
              {s.icon}
            </div>
            <p className="text-3xl font-playfair font-bold text-uph-blue">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* ── Matkul Coverage Table ─────────────────────────────────────── */}
        {incompleteMatkuls.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400" />
                <h3 className="text-sm font-bold text-gray-800">Matkul Perlu Perhatian</h3>
              </div>
              <Link href="/dashboard/admin/matkul" className="text-xs text-uph-blue font-semibold hover:underline">
                Lihat semua
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {incompleteMatkuls.map(m => {
                const noKoor = m.koordinators.length === 0;
                const noDosen = m.dosens.length === 0;
                return (
                  <Link key={m.id} href="/dashboard/admin/matkul"
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{m.name}</p>
                      <div className="flex gap-1.5 mt-0.5">
                        {noKoor && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">Tanpa Koordinator</span>
                        )}
                        {noDosen && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">Tanpa Dosen</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-gray-400 group-hover:text-uph-blue transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Recent Activity ───────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Activity size={14} className="text-gray-400" />
            <h3 className="text-sm font-bold text-gray-800">Aktivitas Terbaru</h3>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada aktivitas</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {activity.map((item, i) => (
                <div key={i} className="flex items-start justify-between px-5 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    {item.kind === 'user' ? (
                      <>
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Mendaftar sebagai {item.roles.join(', ')}
                          {item.status === 'PENDING' && <span className="ml-1 text-amber-600 font-semibold">· Menunggu persetujuan</span>}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.matkulName}</p>
                        <p className="text-xs text-gray-500">
                          Permintaan perubahan
                          {item.status === 'PENDING' && <span className="ml-1 text-blue-600 font-semibold">· Pending</span>}
                          {item.status === 'APPROVED' && <span className="ml-1 text-green-600 font-semibold">· Disetujui</span>}
                          {item.status === 'REJECTED' && <span className="ml-1 text-red-600 font-semibold">· Ditolak</span>}
                        </p>
                      </>
                    )}
                  </div>
                  {item.date && <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(item.date)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Nav — 3 cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/admin/matkul"
          className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-uph-blue hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-uph-blue/10 flex items-center justify-center group-hover:bg-uph-blue/20 transition-colors shrink-0">
            <BookOpen size={22} className="text-uph-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800">Penugasan Matkul</p>
            <p className="text-xs text-gray-500 mt-0.5">Assign koordinator & dosen</p>
            {(matkulNoKoor > 0 || matkulNoDosen > 0) && (
              <p className="text-[10px] font-bold text-red-500 mt-1">{matkulNoKoor + matkulNoDosen} perlu perhatian</p>
            )}
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-uph-blue transition-colors" />
        </Link>

        <Link href="/dashboard/admin/users"
          className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors shrink-0">
            <Users size={22} className="text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800">Kelola Pengguna</p>
            <p className="text-xs text-gray-500 mt-0.5">{totalUsers} pengguna aktif</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-600 transition-colors" />
        </Link>

        <Link href="/dashboard/admin/approvals"
          className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-amber-400 hover:shadow-md transition-all flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors shrink-0 ${pendingUserApprovals > 0 ? 'bg-amber-100 group-hover:bg-amber-200' : 'bg-amber-50 group-hover:bg-amber-100'}`}>
            <UserCheck size={22} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800">Persetujuan Akun</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {pendingUserApprovals > 0
                ? <span className="text-amber-600 font-bold">{pendingUserApprovals} akun pending</span>
                : 'Tidak ada yang pending'}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
        </Link>
      </div>
      <AutoRefresh />
    </div>
  );
}
