import { FileUp, Clock, CheckCircle, AlertCircle, UploadCloud, FilePlus2, XCircle } from 'lucide-react';

const mockRpsList = [
  { id: '1', courseCode: 'CS101', courseName: 'Algoritma & Pemrograman', intake: '23TI1', deadline: '10 Apr 2026', fileName: null, status: 'BELUM SUBMIT' },
  { id: '5', courseCode: 'IS201', courseName: 'Sistem Informasi Manajemen', intake: '23SI2', deadline: '12 Apr 2026', fileName: 'RPS_SIM_v1.pdf', status: 'REJECTED', notes: 'Format tabel evaluasi tidak sesuai dengan standar universitas terbaru. Mohon direvisi pada bagian kriteria penilaian.' },
  { id: '2', courseCode: 'MA105', courseName: 'Matematika Diskrit', intake: '23TI1', deadline: '15 Apr 2026', fileName: 'RPS_Matdis.pdf', status: 'SUBMITTED' },
  { id: '3', courseCode: 'IS204', courseName: 'Pemrograman Web', intake: '22SI1', deadline: '20 Apr 2026', fileName: 'RPS_Web_Prog_2026.docx', status: 'PENGECEKAN' },
  { id: '4', courseCode: 'MA201', courseName: 'Kalkulus Lanjut', intake: '21TI2', deadline: '05 Apr 2026', fileName: 'RPS_Kalkulus_2.pdf', status: 'APPROVED' },
];

export default function DosenRPSPage() {
  const rpsList = mockRpsList;

  return (
    <div>
      <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Kelola RPS</h1>
      <p className="text-gray-500 mb-8">Pilih mata kuliah lalu unggah RPS sesuai dengan instruksi yang diberikan.</p>

      {/* Form Pilih Mata Kuliah untuk Upload */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-xl font-bold text-uph-blue mb-4">Buat Pengajuan RPS Baru</h2>
        <form className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-[2_2_0%]">
            <label className="block text-xs font-semibold text-gray-600 tracking-wider uppercase mb-1.5">Mata Kuliah (Cari Kode/Nama)</label>
            <input 
              list="courses-master" 
              placeholder="Ketik untuk mencari..." 
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-uph-blue bg-white"
            />
            <datalist id="courses-master">
              <option value="CS101 - Algoritma & Pemrograman" />
              <option value="CS202 - Struktur Data" />
              <option value="IS204 - Pemrograman Web" />
              <option value="MA105 - Matematika Diskrit" />
              <option value="MA201 - Kalkulus Lanjut" />
              <option value="EN101 - Bahasa Inggris" />
            </datalist>
          </div>
          
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 tracking-wider uppercase mb-1.5">Semester</label>
            <select className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-uph-blue bg-white">
              <option value="">- Pilih Semester -</option>
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
              <option value="Accel">Accel</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 tracking-wider uppercase mb-1.5">Tahun Ajaran</label>
            <input 
              type="text" 
              placeholder="Cth: 2025/2026" 
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-uph-blue bg-white"
            />
          </div>

          <div className="flex-none">
            <button type="button" className="w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-uph-blue hover:bg-[#111c33] text-white text-sm font-bold rounded-lg transition-colors">
              <FilePlus2 size={16} className="mr-2" />
              Buat Form
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Evaluasi RPS */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Mata Kuliah / Kelas</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Tenggat Waktu</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">File Dokumen</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rpsList.map((rps) => (
                <tr key={rps.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 align-top">
                    <h3 className="font-bold text-gray-800 mb-0.5">{rps.courseName}</h3>
                    <div className="flex items-center text-xs font-medium text-gray-500 space-x-2 mt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wide">{rps.courseCode}</span>
                      <span>•</span>
                      <span>Kelas: <span className="text-uph-blue">{rps.intake}</span></span>
                    </div>
                  </td>
                  <td className="py-4 px-6 align-top">
                    <span className="text-sm text-gray-600 font-medium">{rps.deadline}</span>
                  </td>
                  <td className="py-4 px-6 align-top max-w-[200px]">
                    {rps.fileName ? (
                      <span className={`flex items-center text-sm font-medium ${rps.status === 'REJECTED' ? 'text-gray-400 line-through' : 'text-uph-blue'}`}>
                        <FileUp size={14} className="mr-2" />
                        <a href="#" className="hover:underline truncate" title={rps.fileName}>{rps.fileName}</a>
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 italic">- Belum ada file -</span>
                    )}
                  </td>
                  <td className="py-4 px-6 align-top">
                    {rps.status === 'BELUM SUBMIT' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                        Belum Submit
                      </span>
                    )}
                    {rps.status === 'SUBMITTED' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600">
                        <Clock size={12} className="mr-1.5" />
                        Submitted
                      </span>
                    )}
                    {rps.status === 'PENGECEKAN' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-600">
                        <AlertCircle size={12} className="mr-1.5" />
                        Pengecekan
                      </span>
                    )}
                    {rps.status === 'APPROVED' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600">
                        <CheckCircle size={12} className="mr-1.5" />
                        Disetujui
                      </span>
                    )}
                    {rps.status === 'REJECTED' && (
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
                          <XCircle size={12} className="mr-1.5" />
                          Ditolak / Revisi
                        </span>
                        <span className="text-[11px] text-gray-500 max-w-[150px] leading-snug">
                          <strong className="text-uph-red block mb-0.5">Catatan:</strong>
                          {rps.notes}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 align-top text-center">
                    {rps.status === 'BELUM SUBMIT' || rps.status === 'REJECTED' ? (
                      <label className="inline-flex items-center shrink-0 px-3 py-1.5 bg-uph-red hover:bg-uph-redHover text-white text-xs font-bold rounded-lg transition-colors cursor-pointer">
                        <UploadCloud size={14} className="mr-1.5" />
                        {rps.status === 'REJECTED' ? 'Re-Upload File' : 'Unggah File'}
                        <input type="file" className="hidden" />
                      </label>
                    ) : (
                      <span className="inline-flex items-center shrink-0 px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed">
                        <UploadCloud size={14} className="mr-1.5" />
                        Unggah File
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
