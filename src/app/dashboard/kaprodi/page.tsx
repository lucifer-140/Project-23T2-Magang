import { prisma } from '@/lib/db';
import { FileText, Bell, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function KaprodiDashboard() {
  const [needsReview, pendingRequests, approved] = await Promise.all([
    prisma.rPS.count({ where: { status: 'SUBMITTED' } }),
    prisma.matkulChangeRequest.count({ where: { status: 'PENDING' } }),
    prisma.rPS.count({ where: { status: 'APPROVED' } }),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Dashboard Kaprodi</h1>
      <p className="text-gray-500 mb-8">Pantau pengajuan RPS dan permintaan perubahan dari Admin.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-uph-blue">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">RPS Perlu Review</h3>
            <FileText size={20} className="text-uph-blue opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{needsReview}</p>
          <p className="text-xs text-gray-400 mt-1">Menunggu diperiksa</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Permintaan Perubahan</h3>
            <Bell size={20} className="text-yellow-500 opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{pendingRequests}</p>
          <p className="text-xs text-gray-400 mt-1">Dari Admin, perlu keputusan</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">RPS Disetujui</h3>
            <CheckCircle size={20} className="text-green-500 opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{approved}</p>
          <p className="text-xs text-gray-400 mt-1">Total disetujui</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/kaprodi/rps" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-uph-blue hover:shadow-md transition-all">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-uph-blue/10 flex items-center justify-center group-hover:bg-uph-blue/20 transition-colors">
              <FileText size={24} className="text-uph-blue" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Review RPS Dosen</h3>
              <p className="text-sm text-gray-500">Periksa, setujui, atau minta revisi dokumen RPS</p>
            </div>
          </div>
          {needsReview > 0 && (
            <span className="inline-block text-xs font-bold bg-uph-blue text-white px-2 py-0.5 rounded-full">{needsReview} baru</span>
          )}
        </Link>

        <Link href="/dashboard/kaprodi/requests" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-yellow-500 hover:shadow-md transition-all">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center group-hover:bg-yellow-100 transition-colors">
              <Bell size={24} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Permintaan Perubahan Matkul</h3>
              <p className="text-sm text-gray-500">Setujui atau tolak perubahan data dari Admin</p>
            </div>
          </div>
          {pendingRequests > 0 && (
            <span className="inline-block text-xs font-bold bg-yellow-500 text-white px-2 py-0.5 rounded-full">{pendingRequests} pending</span>
          )}
        </Link>
      </div>
    </div>
  );
}
