import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FileText, CheckCircle, AlertCircle, Clock, CalendarDays, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import AutoRefresh from '@/components/AutoRefresh';

const docTypeLabel: Record<string, string> = {
  RPS: 'RPS', SOAL_UTS: 'Soal UTS', SOAL_UAS: 'Soal UAS',
  LPP: 'LPP', EPP: 'EPP', BERITA_ACARA: 'Berita Acara',
};

export default async function ProdiDashboard() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) redirect('/');

  const [pendingReview, approvedCount, revisionCount, totalDocs, pendingBAP] = await Promise.all([
    prisma.academicDocument.count({ where: { isKoordinatorApproved: true, isProdiApproved: false, status: 'PENGECEKAN' } }),
    prisma.academicDocument.count({ where: { isProdiApproved: true } }),
    prisma.academicDocument.count({ where: { status: 'REVISION', prodiId: userId } }),
    prisma.academicDocument.count(),
    prisma.beritaAcaraPerwalian.count({ where: { status: 'SUBMITTED', isProdiApproved: false } }),
  ]);

  const recentPending = await prisma.academicDocument.findMany({
    where: { isKoordinatorApproved: true, isProdiApproved: false, status: 'PENGECEKAN' },
    include: { matkul: { select: { name: true } }, dosen: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Dashboard PRODI</h1>
        <p className="text-gray-500">Tinjau dan setujui semua dokumen akademik dari seluruh dosen.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Menunggu Review', value: pendingReview,  color: 'border-l-yellow-500', icon: <Clock       size={15} className="text-yellow-500 opacity-50" /> },
          { label: 'Disetujui',       value: approvedCount,  color: 'border-l-green-500',  icon: <CheckCircle size={15} className="text-green-500 opacity-50"  /> },
          { label: 'Perlu Revisi',    value: revisionCount,  color: 'border-l-red-400',    icon: <AlertCircle size={15} className="text-uph-red opacity-50"    /> },
          { label: 'Total Dokumen',   value: totalDocs,      color: 'border-l-uph-blue',   icon: <FileText    size={15} className="text-uph-blue opacity-50"   /> },
          { label: 'BAP Pending',     value: pendingBAP,     color: 'border-l-teal-500',   icon: <CalendarDays size={15} className="text-teal-500 opacity-50"  /> },
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
            <p className="font-bold text-gray-800">Review Semua Dokumen</p>
            <p className="text-sm text-gray-500">Buka daftar matkul untuk memeriksa dan menyetujui dokumen</p>
          </div>
          {pendingReview > 0 && (
            <span className="text-xs font-bold bg-uph-blue text-white px-2 py-0.5 rounded-full shrink-0">{pendingReview} menunggu</span>
          )}
          <ChevronRight size={16} className="text-gray-400 group-hover:text-uph-blue transition-colors shrink-0" />
        </Link>

        <Link href="/dashboard/berita-acara" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors shrink-0">
            <CalendarDays size={22} className="text-teal-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">Berita Acara Perwalian</p>
            <p className="text-sm text-gray-500">Tinjau dan setujui berita acara dari dosen PA</p>
          </div>
          {pendingBAP > 0 && (
            <span className="text-xs font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full shrink-0">{pendingBAP} pending</span>
          )}
          <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-600 transition-colors shrink-0" />
        </Link>
      </div>

      {/* Recent pending */}
      {recentPending.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-yellow-500" />
              <h3 className="font-bold text-gray-800 text-sm">Dokumen Menunggu Persetujuan PRODI</h3>
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
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">Pengecekan</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <p className="font-bold text-gray-700">Semua dokumen sudah ditinjau</p>
          <p className="text-sm text-gray-400 mt-1">Tidak ada dokumen yang menunggu persetujuan PRODI.</p>
        </div>
      )}
      <AutoRefresh />
    </div>
  );
}
