export default async function AdminDashboard() {
  const totalRps = 15;
  const checkingRps = 3;
  const approvedRps = 12;

  return (
    <div>
      <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Selamat Datang, Kaprodi</h1>
      <p className="text-gray-500 mb-8">Ini adalah beranda Portal Administrasi Anda.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-uph-red">
          <h3 className="text-lg font-bold text-gray-800">Total RPS Diajukan</h3>
          <p className="text-3xl font-playfair font-bold text-uph-blue mt-2">{totalRps}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-yellow-500">
          <h3 className="text-lg font-bold text-gray-800">Perlu Dicek</h3>
          <p className="text-3xl font-playfair font-bold text-uph-blue mt-2">{checkingRps}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <h3 className="text-lg font-bold text-gray-800">Disetujui</h3>
          <p className="text-3xl font-playfair font-bold text-uph-blue mt-2">{approvedRps}</p>
        </div>
      </div>
    </div>
  );
}
