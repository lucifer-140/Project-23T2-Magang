import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FileText, CheckCircle, Users, Bookmark, Library, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function KoordinatorDashboard() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) redirect('/');

  const matkuls = await prisma.matkul.findMany({
    where: { koordinators: { some: { id: userId } } },
    include: { dosens: true, academicDocs: true },
  });

  const dosensSet = new Set<string>();
  let pendingReview = 0;
  let approvedCount = 0;
  let revisionCount = 0;

  matkuls.forEach(m => {
    m.dosens.forEach(d => dosensSet.add(d.id));
    pendingReview += m.academicDocs.filter(d => d.status === 'SUBMITTED').length;
    approvedCount += m.academicDocs.filter(d => d.status === 'APPROVED').length;
    revisionCount += m.academicDocs.filter(d => d.status === 'REVISION').length;
  });

  const matkulCount = matkuls.length;
  const dosenCount = dosensSet.size;

  return (
    <div>
      <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Dashboard Koordinator</h1>
      <p className="text-gray-500 mb-8">Pantau dokumen akademik dari dosen yang Anda koordinasikan.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-uph-blue">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Matkul Koordinasi</h3>
            <Bookmark size={20} className="text-uph-blue opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{matkulCount}</p>
          <p className="text-xs text-gray-400 mt-1">Mata kuliah ditugaskan</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Dosen Terlibat</h3>
            <Users size={20} className="text-teal-500 opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{dosenCount}</p>
          <p className="text-xs text-gray-400 mt-1">Across semua matkul</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Perlu Review</h3>
            <FileText size={20} className="text-yellow-500 opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{pendingReview}</p>
          <p className="text-xs text-gray-400 mt-1">Menunggu diperiksa</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Disetujui</h3>
            <CheckCircle size={20} className="text-green-500 opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{approvedCount}</p>
          <p className="text-xs text-gray-400 mt-1">Total dokumen disetujui</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/matkul" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-uph-blue hover:shadow-md transition-all">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-uph-blue/10 flex items-center justify-center group-hover:bg-uph-blue/20 transition-colors">
              <Library size={24} className="text-uph-blue" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Review Dokumen Akademik</h3>
              <p className="text-sm text-gray-500">Periksa dan setujui dokumen dosen di matkul Anda</p>
            </div>
          </div>
          {pendingReview > 0 && (
            <span className="inline-block text-xs font-bold bg-uph-blue text-white px-2 py-0.5 rounded-full">{pendingReview} menunggu</span>
          )}
        </Link>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertCircle size={24} className="text-uph-red" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Dokumen Perlu Revisi</h3>
              <p className="text-sm text-gray-500">Dokumen yang dikembalikan untuk diperbaiki</p>
            </div>
          </div>
          <p className="text-3xl font-playfair font-bold text-uph-red">{revisionCount}</p>
        </div>
      </div>
    </div>
  );
}
