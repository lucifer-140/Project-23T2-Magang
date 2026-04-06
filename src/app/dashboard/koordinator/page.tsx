import { Construction, Monitor, BookOpen } from 'lucide-react';

export default function KoordinatorDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Dashboard Koordinator</h1>
      <p className="text-gray-500 mb-8">Selamat datang di portal Koordinator Program Studi.</p>

      <div className="bg-white rounded-2xl shadow-sm border border-dashed border-teal-200 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-teal-50 rounded-2xl flex items-center justify-center">
          <Construction size={32} className="text-teal-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Halaman Dalam Pengembangan</h2>
        <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
          Fitur untuk Koordinator sedang dalam proses pengembangan. Halaman ini akan segera tersedia dengan fungsionalitas yang sesuai dengan peran Koordinator Program Studi.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <span className="text-xs bg-teal-50 text-teal-600 px-3 py-1.5 rounded-full font-semibold border border-teal-100">Monitoring Matkul</span>
          <span className="text-xs bg-teal-50 text-teal-600 px-3 py-1.5 rounded-full font-semibold border border-teal-100">Laporan Progress</span>
          <span className="text-xs bg-teal-50 text-teal-600 px-3 py-1.5 rounded-full font-semibold border border-teal-100">Koordinasi Dosen</span>
        </div>
      </div>
    </div>
  );
}
