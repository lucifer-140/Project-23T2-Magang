import { prisma } from '@/lib/db';
import { FileText, Bell, UserCheck, ChevronRight, CalendarDays, BarChart2 } from 'lucide-react';
import Link from 'next/link';
import KaprodiDashboardWrapper from './KaprodiDashboardWrapper';
import AutoRefresh from '@/components/AutoRefresh';

const docTypeLabel: Record<string, string> = {
  RPS: 'RPS', SOAL_UTS: 'Soal UTS', SOAL_UAS: 'Soal UAS',
  LPP: 'LPP', EPP: 'EPP', BERITA_ACARA: 'Berita Acara',
};

export default async function KaprodiDashboard() {
  const [pendingRequests, recentPending] = await Promise.all([
    prisma.matkulChangeRequest.count({ where: { status: 'PENDING' } }),
    prisma.academicDocument.findMany({
      where: { status: 'SUBMITTED' },
      include: { matkul: { select: { name: true } }, dosen: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Dashboard Kaprodi</h1>
        <p className="text-gray-500">Pantau dokumen akademik, analitik EPP, dan permintaan perubahan.</p>
      </div>

      <KaprodiDashboardWrapper />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={15} className="text-gray-400" />
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Aksi Cepat</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/matkul" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-uph-blue hover:shadow-md transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-uph-blue/10 flex items-center justify-center group-hover:bg-uph-blue/20 transition-colors shrink-0">
              <FileText size={20} className="text-uph-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm">Review Dokumen</p>
              <p className="text-xs text-gray-500">Setujui atau minta revisi</p>
            </div>
            {recentPending.length > 0 && (
              <span className="text-xs font-bold bg-uph-blue text-white px-1.5 py-0.5 rounded-full shrink-0">{recentPending.length}</span>
            )}
          </Link>

          <Link href="/dashboard/kaprodi/requests" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-orange-400 hover:shadow-md transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors shrink-0">
              <Bell size={20} className="text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm">Permintaan Perubahan</p>
              <p className="text-xs text-gray-500">Setujui atau tolak dari Admin</p>
            </div>
            {pendingRequests > 0 && (
              <span className="text-xs font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded-full shrink-0">{pendingRequests}</span>
            )}
          </Link>

          <Link href="/dashboard/kaprodi/prodi-users" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-purple-400 hover:shadow-md transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors shrink-0">
              <UserCheck size={20} className="text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm">Kelola PRODI</p>
              <p className="text-xs text-gray-500">Manajemen pengguna PRODI</p>
            </div>
            <ChevronRight size={15} className="text-gray-400 group-hover:text-purple-500 transition-colors shrink-0" />
          </Link>

          <Link href="/dashboard/berita-acara" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors shrink-0">
              <CalendarDays size={20} className="text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm">Kelola Berita Acara</p>
              <p className="text-xs text-gray-500">Perwalian mahasiswa</p>
            </div>
            <ChevronRight size={15} className="text-gray-400 group-hover:text-teal-600 transition-colors shrink-0" />
          </Link>
        </div>
      </div>

      {recentPending.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <h3 className="font-bold text-gray-800 text-sm">Dokumen Menunggu Review</h3>
            </div>
            <Link href="/dashboard/matkul?filter=pending" className="text-xs text-uph-blue font-semibold hover:underline">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentPending.map(doc => (
              <div key={doc.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{doc.matkul.name}</p>
                  <p className="text-xs text-gray-500">{doc.dosen.name} · {docTypeLabel[doc.type] ?? doc.type}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">Dikirim</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
            <FileText size={22} className="text-green-400" />
          </div>
          <p className="font-bold text-gray-700">Semua dokumen sudah ditinjau</p>
          <p className="text-sm text-gray-400 mt-1">Tidak ada dokumen yang menunggu review Kaprodi.</p>
        </div>
      )}
      <AutoRefresh />
    </div>
  );
}
