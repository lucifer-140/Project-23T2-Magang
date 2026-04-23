import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FileText, CheckCircle, Clock, AlertCircle, Users, Bookmark, CalendarDays, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const docTypeLabel: Record<string, string> = {
  RPS: 'RPS', SOAL_UTS: 'Soal UTS', SOAL_UAS: 'Soal UAS',
  LPP: 'LPP', EPP: 'EPP', BERITA_ACARA: 'Berita Acara',
};

export default async function KoordinatorDashboard() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) redirect('/');

  const coordMatkuls = await prisma.matkul.findMany({
    where: { koordinators: { some: { id: userId } } },
    include: { dosens: { select: { id: true } } },
  });

  const dosensSet = new Set(coordMatkuls.flatMap(m => m.dosens.map(d => d.id)));

  const [pendingReview, revisionCount, approvedCount] = await Promise.all([
    prisma.academicDocument.count({ where: { matkul: { koordinators: { some: { id: userId } } }, status: 'SUBMITTED' } }),
    prisma.academicDocument.count({ where: { matkul: { koordinators: { some: { id: userId } } }, status: 'REVISION' } }),
    prisma.academicDocument.count({ where: { matkul: { koordinators: { some: { id: userId } } }, isKoordinatorApproved: true } }),
  ]);

  const recentPending = await prisma.academicDocument.findMany({
    where: { matkul: { koordinators: { some: { id: userId } } }, status: 'SUBMITTED' },
    include: { matkul: { select: { name: true } }, dosen: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Dashboard Koordinator</h1>
        <p className="text-gray-500">Pantau dan review dokumen akademik dari dosen yang Anda koordinasikan.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Matkul Koordinasi', value: coordMatkuls.length, color: 'border-l-uph-blue',   icon: <Bookmark    size={15} className="text-uph-blue opacity-50"   /> },
          { label: 'Dosen Terlibat',   value: dosensSet.size,       color: 'border-l-teal-500',   icon: <Users       size={15} className="text-teal-500 opacity-50"   /> },
          { label: 'Perlu Review',     value: pendingReview,        color: 'border-l-yellow-500', icon: <Clock       size={15} className="text-yellow-500 opacity-50" /> },
          { label: 'Revisi',           value: revisionCount,        color: 'border-l-red-400',    icon: <AlertCircle size={15} className="text-red-400 opacity-50"    /> },
          { label: 'Disetujui',        value: approvedCount,        color: 'border-l-green-500',  icon: <CheckCircle size={15} className="text-green-500 opacity-50"  /> },
        ].map(s => (
          <div key={s.label} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 ${s.color}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">{s.label}</span>
              {s.icon}
            </div>
            <p className="text-3xl font-playfair font-bold text-uph-blue">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/matkul" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-uph-blue hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-uph-blue/10 flex items-center justify-center group-hover:bg-uph-blue/20 transition-colors shrink-0">
            <FileText size={22} className="text-uph-blue" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">Review Dokumen Akademik</p>
            <p className="text-sm text-gray-500">Periksa dan setujui dokumen dosen di matkul Anda</p>
          </div>
          {pendingReview > 0 && (
            <span className="text-xs font-bold bg-uph-blue text-white px-2 py-0.5 rounded-full">{pendingReview} menunggu</span>
          )}
          <ChevronRight size={16} className="text-gray-400 group-hover:text-uph-blue transition-colors" />
        </Link>

        <Link href="/dashboard/berita-acara" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors shrink-0">
            <CalendarDays size={22} className="text-teal-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">Berita Acara Perwalian</p>
            <p className="text-sm text-gray-500">Pantau kehadiran dan perwalian mahasiswa</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-600 transition-colors" />
        </Link>
      </div>

      {/* Recent pending */}
      {recentPending.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-yellow-500" />
              <h3 className="font-bold text-gray-800 text-sm">Menunggu Review</h3>
            </div>
            <Link href="/dashboard/matkul" className="text-xs text-uph-blue font-semibold hover:underline">Lihat Semua</Link>
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
          <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <p className="font-bold text-gray-700">
            {coordMatkuls.length === 0 ? 'Belum ada matkul yang ditugaskan' : 'Semua dokumen sudah ditinjau'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {coordMatkuls.length === 0 ? 'Hubungi Admin untuk penugasan koordinasi.' : 'Tidak ada dokumen yang menunggu review.'}
          </p>
        </div>
      )}
    </div>
  );
}
