import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function ProdiDashboard() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) redirect('/');

  const [pendingReview, approvedCount, revisionCount, totalDocs] = await Promise.all([
    prisma.academicDocument.count({
      where: { isKoordinatorApproved: true, isProdiApproved: false, status: 'PENGECEKAN' },
    }),
    prisma.academicDocument.count({
      where: { isProdiApproved: true },
    }),
    prisma.academicDocument.count({
      where: { status: 'REVISION', prodiId: userId },
    }),
    prisma.academicDocument.count({}),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Dashboard PRODI</h1>
      <p className="text-gray-500 mb-8">Tinjau dan setujui semua dokumen akademik dari seluruh dosen.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Menunggu Review</h3>
            <Clock size={20} className="text-yellow-500 opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{pendingReview}</p>
          <p className="text-xs text-gray-400 mt-1">Sudah disetujui Koordinator</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Disetujui</h3>
            <CheckCircle size={20} className="text-green-500 opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{approvedCount}</p>
          <p className="text-xs text-gray-400 mt-1">Total dokumen disetujui</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-uph-red">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Perlu Revisi</h3>
            <AlertCircle size={20} className="text-uph-red opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{revisionCount}</p>
          <p className="text-xs text-gray-400 mt-1">Dikembalikan oleh Anda</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-uph-blue">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Dokumen</h3>
            <FileText size={20} className="text-uph-blue opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{totalDocs}</p>
          <p className="text-xs text-gray-400 mt-1">Semua dokumen akademik</p>
        </div>
      </div>

      <Link
        href="/dashboard/matkul"
        className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-uph-blue hover:shadow-md transition-all flex items-center space-x-4"
      >
        <div className="w-12 h-12 rounded-xl bg-uph-blue/10 flex items-center justify-center group-hover:bg-uph-blue/20 transition-colors">
          <FileText size={24} className="text-uph-blue" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800">Review Semua Dokumen</h3>
          <p className="text-sm text-gray-500">Buka daftar mata kuliah untuk memeriksa dan menyetujui dokumen</p>
        </div>
        {pendingReview > 0 && (
          <span className="inline-block text-xs font-bold bg-uph-blue text-white px-2 py-0.5 rounded-full">{pendingReview} menunggu</span>
        )}
      </Link>
    </div>
  );
}
