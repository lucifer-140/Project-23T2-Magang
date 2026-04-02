export default function DosenDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Selamat Datang, Dosen</h1>
      <p className="text-gray-500 mb-8">Ini adalah beranda Portal Administrasi Anda.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-uph-red">
          <h3 className="text-lg font-bold text-gray-800">Total RPS</h3>
          <p className="text-3xl font-playfair font-bold text-uph-blue mt-2">5</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
          <h3 className="text-lg font-bold text-gray-800">Dalam Pengecekan</h3>
          <p className="text-3xl font-playfair font-bold text-uph-blue mt-2">1</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <h3 className="text-lg font-bold text-gray-800">Disetujui</h3>
          <p className="text-3xl font-playfair font-bold text-uph-blue mt-2">4</p>
        </div>
      </div>
    </div>
  );
}
