import { prisma } from '@/lib/db';
import { BookOpen, Users, Bell, Activity } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const [totalMatkul, totalUsers, pendingRequests] = await Promise.all([
    prisma.matkul.count(),
    prisma.user.count({ where: { roles: { hasSome: ['DOSEN', 'KOORDINATOR'] } } }),
    prisma.matkulChangeRequest.count({ where: { status: 'PENDING' } }),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Dashboard Admin</h1>
      <p className="text-gray-500 mb-8">Kelola mata kuliah, pengguna, dan konfigurasi sistem akademik.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-uph-blue">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Matkul</h3>
            <BookOpen size={20} className="text-uph-blue opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{totalMatkul}</p>
          <p className="text-xs text-gray-400 mt-1">Mata kuliah terdaftar</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pengguna Aktif</h3>
            <Users size={20} className="text-teal-500 opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{totalUsers}</p>
          <p className="text-xs text-gray-400 mt-1">Dosen & Koordinator</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Permintaan Pending</h3>
            <Bell size={20} className="text-yellow-500 opacity-60" />
          </div>
          <p className="text-4xl font-playfair font-bold text-uph-blue">{pendingRequests}</p>
          <p className="text-xs text-gray-400 mt-1">Menunggu approval Kaprodi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/admin/matkul" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-uph-blue hover:shadow-md transition-all">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-uph-blue/10 flex items-center justify-center group-hover:bg-uph-blue/20 transition-colors">
              <BookOpen size={24} className="text-uph-blue" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Kelola Mata Kuliah</h3>
              <p className="text-sm text-gray-500">Tambah, assign ke dosen, ajukan perubahan</p>
            </div>
          </div>
          <span className="text-xs font-bold text-uph-blue group-hover:underline">Buka →</span>
        </Link>

        <Link href="/dashboard/admin/users" className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
              <Users size={24} className="text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Kelola Pengguna</h3>
              <p className="text-sm text-gray-500">Assign role dan mata kuliah ke pengguna</p>
            </div>
          </div>
          <span className="text-xs font-bold text-teal-600 group-hover:underline">Buka →</span>
        </Link>
      </div>
    </div>
  );
}
