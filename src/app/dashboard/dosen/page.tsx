import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default async function DosenDashboard() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  const rpsList = userId ? await prisma.rPS.findMany({
    where: { dosenId: userId },
    include: { matkul: { select: { name: true } } },
  }) : [];

  const total = rpsList.length;
  const submitted = rpsList.filter(r => r.status === 'SUBMITTED' || r.status === 'PENGECEKAN').length;
  const approved = rpsList.filter(r => r.status === 'APPROVED').length;
  const revision = rpsList.filter(r => r.status === 'REVISION').length;

  return (
    <div>
      <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Selamat Datang, Dosen</h1>
      <p className="text-gray-500 mb-8">Pantau status pengajuan RPS Anda di portal ini.</p>

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
  );
}
