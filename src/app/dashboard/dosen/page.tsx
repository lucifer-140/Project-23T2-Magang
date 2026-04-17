import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { FileText, CheckCircle, Clock, AlertCircle, Users, Activity, Bookmark, Inbox, Bell } from 'lucide-react';
import Link from 'next/link';

export default async function DosenDashboard() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleStr = cookieStore.get('userRole')?.value;

  let decodedRoleStr = roleStr || '';
  try { decodedRoleStr = decodeURIComponent(decodedRoleStr); } catch(e) {}

  let roles: string[] = [];
  try {
    const parsed = JSON.parse(decodedRoleStr || '[]');
    if (Array.isArray(parsed)) roles = parsed;
    else roles = [parsed];
  } catch (e) {
    roles = [decodedRoleStr || ''];
  }

  // DOSEN FETCH
  const [total, submitted, revision, approved] = userId ? await Promise.all([
    prisma.matkul.count({ where: { dosens: { some: { id: userId } } } }),
    prisma.academicDocument.count({ where: { dosenId: userId, status: { in: ['SUBMITTED', 'PENGECEKAN'] } } }),
    prisma.academicDocument.count({ where: { dosenId: userId, status: 'REVISION' } }),
    prisma.academicDocument.count({ where: { dosenId: userId, status: 'APPROVED' } }),
  ]) : [0, 0, 0, 0];

  // KOORDINATOR FETCH
  let koordStats = { matkuls: 0, totalDosens: 0, rpsSubmitted: 0 };
  if (roles.includes('KOORDINATOR') && userId) {
    const koordinatorMatkuls = await prisma.matkul.findMany({
      where: { koordinators: { some: { id: userId } } },
      include: { dosens: true, academicDocs: true },
    });

    const dosensSet = new Set<string>();
    let rpsSub = 0;
    koordinatorMatkuls.forEach(m => {
      m.dosens.forEach(d => dosensSet.add(d.id));
      rpsSub += m.academicDocs.filter(d => d.status !== 'UNSUBMITTED').length;
    });

    koordStats = {
      matkuls: koordinatorMatkuls.length,
      totalDosens: dosensSet.size,
      rpsSubmitted: rpsSub,
    };
  }

  // KAPRODI FETCH
  let kaprodiStats = { rpsNeedsReview: 0, totalRps: 0, pendingRequests: 0 };
  if (roles.includes('KAPRODI')) {
    [kaprodiStats.rpsNeedsReview, kaprodiStats.totalRps, kaprodiStats.pendingRequests] = await Promise.all([
      prisma.academicDocument.count({ where: { status: 'SUBMITTED' } }),
      prisma.academicDocument.count(),
      prisma.matkulChangeRequest.count({ where: { status: 'PENDING' } }),
    ]);
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Selamat Datang</h1>
        <p className="text-gray-500 mb-8">Pantau status akademik dan tugas Anda di portal ini.</p>

        {/* DOSEN SECTION */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Bookmark className="text-uph-blue" size={20} />
            <h2 className="text-xl font-bold text-gray-800">Status Tugas Dosen</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-uph-blue">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Matkul</h3>
                <FileText size={18} className="text-uph-blue opacity-50" />
              </div>
              <p className="text-4xl font-playfair font-bold text-uph-blue">{total}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Dalam Proses</h3>
                <Clock size={18} className="text-yellow-500 opacity-50" />
              </div>
              <p className="text-4xl font-playfair font-bold text-uph-blue">{submitted}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-400">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Perlu Revisi</h3>
                <AlertCircle size={18} className="text-red-400 opacity-50" />
              </div>
              <p className="text-4xl font-playfair font-bold text-uph-blue">{revision}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Disetujui</h3>
                <CheckCircle size={18} className="text-green-500 opacity-50" />
              </div>
              <p className="text-4xl font-playfair font-bold text-uph-blue">{approved}</p>
            </div>
          </div>
        </div>

        {/* KOORDINATOR SECTION */}
        {roles.includes('KOORDINATOR') && (
          <div className="mb-6 mt-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="text-uph-blue" size={20} />
                <h2 className="text-xl font-bold text-gray-800">Tinjauan Koordinator</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Matkul Koordinasi</h3>
                  <p className="text-3xl font-playfair font-bold text-gray-800">{koordStats.matkuls}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-uph-blue">
                  <Bookmark size={24} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Dosen Terlibat</h3>
                  <p className="text-3xl font-playfair font-bold text-gray-800">{koordStats.totalDosens}</p>
                </div>
                <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
                  <Users size={24} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Dokumen Diterima Sistem</h3>
                  <p className="text-3xl font-playfair font-bold text-gray-800">{koordStats.rpsSubmitted}</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                  <FileText size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KAPRODI SECTION */}
        {roles.includes('KAPRODI') && (
          <div className="mb-6 mt-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="text-uph-blue" size={20} />
                <h2 className="text-xl font-bold text-gray-800">Tinjauan Kaprodi</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                  <Inbox size={80} className="text-blue-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Dokumen Perlu Review</h3>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-playfair font-bold text-blue-600">{kaprodiStats.rpsNeedsReview}</p>
                  <p className="text-sm text-gray-400 mb-1">dari {kaprodiStats.totalRps} total pengajuan</p>
                </div>
                <Link href="/dashboard/matkul" className="inline-block mt-4 text-xs font-bold text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                  Mulai Evaluasi &rarr;
                </Link>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                  <Bell size={80} className="text-orange-500" />
                </div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Permintaan Perubahan</h3>
                <div className="flex items-end gap-3">
                  <p className="text-4xl font-playfair font-bold text-orange-500">{kaprodiStats.pendingRequests}</p>
                  <p className="text-sm text-gray-400 mb-1">menunggu keputusan</p>
                </div>
                <Link href="/dashboard/kaprodi/requests" className="inline-block mt-4 text-xs font-bold text-orange-600 border border-orange-200 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors">
                  Lihat Permintaan &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
