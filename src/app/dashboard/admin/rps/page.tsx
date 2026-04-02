"use client";

import { useState } from 'react';
import { 
  FileText, Clock, CheckCircle, Mail, Download, Inbox, 
  ChevronDown, ChevronUp, AlertCircle, FileArchive, Activity, X
} from 'lucide-react';

// MOCK DATA
const mockSubmissions = [
  { id: '1', courseName: 'Algoritma Pemrograman', dosen: 'Dr. Budi Santoso', status: '1_SUBMITTED', submitDate: '10 Apr 2026', revisionDate: null, notes: null, approvalDate: null, fileName: 'RPS_Algo_2026.pdf' },
  { id: '2', courseName: 'Sistem Basis Data', dosen: 'Siti Aminah, M.Kom', status: '3_REVISION', submitDate: '05 Apr 2026', revisionDate: '08 Apr 2026', notes: 'Kurang detail kriteria evaluasi', approvalDate: null, fileName: 'RPS_SBD_Genap.docx' },
  { id: '3', courseName: 'Kecerdasan Buatan', dosen: 'Ahmad Fauzi, Ph.D', status: '4_APPROVED', submitDate: '01 Apr 2026', revisionDate: null, notes: null, approvalDate: '03 Apr 2026', fileName: 'RPS_AI_V2.pdf' },
  { id: '4', courseName: 'Struktur Data', dosen: 'Dr. Budi Santoso', status: '2_IN_REVIEW', submitDate: '09 Apr 2026', revisionDate: null, notes: null, approvalDate: null, fileName: 'RPS_SD_2026.pdf' },
  { id: '5', courseName: 'Jaringan Komputer', dosen: 'Dr. Budi Santoso', status: '4_APPROVED', submitDate: '20 Mar 2026', revisionDate: null, notes: null, approvalDate: '22 Mar 2026', fileName: 'RPS_Jarkom_2026.pdf' },
  { id: '6', courseName: 'Pemrograman Web', dosen: 'Siti Aminah, M.Kom', status: '0_UNSUBMITTED', submitDate: null, revisionDate: null, notes: null, approvalDate: null, fileName: null }
];

const dosenGroups = [
  {
    name: 'Dr. Budi Santoso',
    totalMatkul: 3,
    approved: 1, 
    progress: 33,
    courses: [
      { name: 'Algoritma Pemrograman', status: '1_SUBMITTED' },
      { name: 'Struktur Data', status: '2_IN_REVIEW' },
      { name: 'Jaringan Komputer', status: '4_APPROVED' },
    ]
  },
  {
    name: 'Siti Aminah, M.Kom',
    totalMatkul: 2,
    approved: 0,
    progress: 0,
    courses: [
      { name: 'Sistem Basis Data', status: '3_REVISION' },
      { name: 'Pemrograman Web', status: '0_UNSUBMITTED' },
    ]
  },
  {
    name: 'Ahmad Fauzi, Ph.D',
    totalMatkul: 1,
    approved: 1,
    progress: 100,
    courses: [
      { name: 'Kecerdasan Buatan', status: '4_APPROVED' }
    ]
  }
];

export default function AdminRPSPage() {
  const [activeTab, setActiveTab] = useState('review');
  const [expandedDosen, setExpandedDosen] = useState<string | null>(null);
  
  // Modal State
  const [reviewingRpsId, setReviewingRpsId] = useState<string | null>(null);

  const needsReviewData = mockSubmissions.filter(d => d.status === '1_SUBMITTED');
  const pendingRevisionData = mockSubmissions.filter(d => d.status === '3_REVISION');
  const archivedData = mockSubmissions.filter(d => d.status === '4_APPROVED');

  const getStatusBadge = (status: string) => {
    switch(status) {
      case '0_UNSUBMITTED': return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">WAITING</span>;
      case '1_SUBMITTED': return <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-bold">NEEDS REVIEW</span>;
      case '2_IN_REVIEW': return <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded text-xs font-bold">IN REVIEW</span>;
      case '3_REVISION': return <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-bold">WAITING REVISION</span>;
      case '4_APPROVED': return <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-bold">COMPLETED</span>;
      default: return null;
    }
  }

  const reviewingObj = mockSubmissions.find(d => d.id === reviewingRpsId);

  return (
    <>
      <div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Evaluasi RPS</h1>
        <p className="text-gray-500 mb-8">Pantau dan verifikasi pengajuan RPS menggunakan Workspace berorientasi prioritas.</p>

        {/* Tabs Menu */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('review')}
            className={`flex items-center px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'review' ? 'border-uph-blue text-uph-blue' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <Inbox size={18} className="mr-2" />
            Needs Review
            <span className="ml-2 bg-uph-blue text-white text-[10px] px-2 py-0.5 rounded-full">{needsReviewData.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('revision')}
            className={`flex items-center px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'revision' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <AlertCircle size={18} className="mr-2" />
            Menunggu Revisi
            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${activeTab === 'revision' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{pendingRevisionData.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('directory')}
            className={`flex items-center px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'directory' ? 'border-uph-blue text-uph-blue' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <Activity size={18} className="mr-2" />
            Direktori Dosen
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            className={`flex items-center px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'archive' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
          >
            <FileArchive size={18} className="mr-2" />
            Arsip Terverifikasi
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* TAB 1: NEEDS REVIEW */}
          {activeTab === 'review' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Mata Kuliah</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Dosen Pengampu</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Tanggal Submit</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {needsReviewData.map((rps) => (
                    <tr key={rps.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-4 px-6 font-bold text-gray-800">{rps.courseName}</td>
                      <td className="py-4 px-6 font-medium text-gray-600">{rps.dosen}</td>
                      <td className="py-4 px-6">
                        <span className="flex items-center text-sm font-semibold text-gray-700 bg-gray-100 w-fit px-2 py-1 rounded">
                          <Clock size={12} className="mr-1.5 text-gray-400" />
                          {rps.submitDate}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => setReviewingRpsId(rps.id)}
                          className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          <FileText size={14} className="mr-1.5" />
                          Review Dokumen
                        </button>
                      </td>
                    </tr>
                  ))}
                  {needsReviewData.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-400">Tidak ada dokumen baru.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: WAITING REVISION */}
          {activeTab === 'revision' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Mata Kuliah & Dosen</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Tgl Revisi Diberikan</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase w-1/3">Catatan Revisi Terakhir</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingRevisionData.map((rps) => (
                    <tr key={rps.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <h3 className="font-bold text-gray-800 mb-0.5">{rps.courseName}</h3>
                        <span className="text-sm text-gray-500">{rps.dosen}</span>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-600">{rps.revisionDate}</td>
                      <td className="py-4 px-6">
                        <div className="bg-orange-50 text-orange-800 text-xs p-2 rounded-md border border-orange-100 italic">
                          "{rps.notes}"
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button className="inline-flex items-center px-4 py-2 border border-orange-500 text-orange-600 hover:bg-orange-50 text-xs font-bold rounded-lg transition-colors">
                          <Mail size={14} className="mr-1.5" />
                          Kirim Pengingat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: DIREKTORI DOSEN */}
          {activeTab === 'directory' && (
            <div className="p-4">
              <div className="flex flex-col gap-3">
                {dosenGroups.map((dosen, idx) => {
                  const isExpanded = expandedDosen === dosen.name;
                  const progressColor = dosen.progress === 100 ? 'bg-green-500' : dosen.progress > 0 ? 'bg-uph-blue' : 'bg-gray-200';
                  return (
                    <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden transition-all bg-white">
                      {/* Header baris / Accordion Trigger */}
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedDosen(isExpanded ? null : dosen.name)}
                      >
                        <div className="flex-1 flex justify-between items-center pr-6">
                          <div className="w-1/3">
                            <h3 className="font-bold text-gray-800 text-sm">{dosen.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{dosen.totalMatkul} Mata Kuliah Ditugaskan</p>
                          </div>
                          
                          <div className="w-1/3 flex items-center justify-center">
                            <div className="w-full max-w-[150px]">
                              <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-gray-500">Progress</span>
                                <span className="text-gray-800">{dosen.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className={`${progressColor} h-2 rounded-full`} style={{ width: `${dosen.progress}%` }}></div>
                              </div>
                            </div>
                          </div>

                          <div className="w-1/3 flex justify-end">
                            <button className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                              <Mail size={14} className="mr-1.5" /> Email Dosen
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-gray-400">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>

                      {/* Expandable Table Data */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                          <table className="w-full text-sm text-left">
                            <thead>
                              <tr className="text-gray-500 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                                <th className="py-2 px-4">Mata Kuliah</th>
                                <th className="py-2 px-4">Status Terakhir</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dosen.courses.map((c, i) => (
                                <tr key={i} className="border-b border-gray-100/50 last:border-0 hover:bg-white">
                                  <td className="py-3 px-4 font-semibold text-gray-700">{c.name}</td>
                                  <td className="py-3 px-4">{getStatusBadge(c.status)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ARSIP TERVERIFIKASI */}
          {activeTab === 'archive' && (
            <div>
              <div className="flex justify-end p-4 border-b border-gray-100 bg-gray-50/50">
                 <button className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-bold rounded-lg transition-colors border border-green-200 shadow-sm">
                   <Download size={14} className="mr-1.5" />
                   Export Rekap (Excel)
                 </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Mata Kuliah / Dosen</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Tanggal Disetujui</th>
                      <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {archivedData.map((rps) => (
                      <tr key={rps.id} className="hover:bg-green-50/30 transition-colors">
                        <td className="py-4 px-6">
                          <h3 className="font-bold text-gray-800 mb-0.5">{rps.courseName}</h3>
                          <span className="text-sm text-gray-500 flex items-center">
                            <CheckCircle size={12} className="mr-1 text-green-500" />
                            {rps.dosen}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-700">{rps.approvalDate}</td>
                        <td className="py-4 px-6 text-center">
                          <button className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                            <Download size={14} className="mr-1.5" /> Download PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Review Modal */}
      {reviewingObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Review Dokumen RPS</h2>
              <button 
                onClick={() => setReviewingRpsId(null)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mata Kuliah</h3>
                <p className="text-lg font-bold text-uph-blue">{reviewingObj.courseName}</p>
                <div className="flex items-center text-sm font-medium text-gray-600 mt-1">
                  <span>Dosen: {reviewingObj.dosen}</span>
                  <span className="mx-2">•</span>
                  <span>Disubmit: {reviewingObj.submitDate}</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6 flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="text-uph-blue mr-3" size={24} />
                  <div>
                    <p className="font-bold text-uph-blue text-sm">{reviewingObj.fileName}</p>
                    <p className="text-xs text-blue-600">Dokumen PDF/Word siap untuk direview.</p>
                  </div>
                </div>
                <button className="inline-flex items-center px-4 py-2 bg-uph-blue text-white hover:bg-[#111c33] text-sm font-bold rounded-lg transition-colors shadow-sm">
                  <Download size={16} className="mr-1.5" />
                  Download
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Catatan Revisi (Opsional jika disetujui, Wajib jika ditolak)
                </label>
                <textarea 
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-uph-blue text-sm min-h-[120px]"
                  placeholder="Tuliskan masukan spesifik mengapa RPS ini perlu direvisi..."
                ></textarea>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setReviewingRpsId(null)}
                className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => setReviewingRpsId(null)}
                className="px-5 py-2.5 bg-uph-red hover:bg-uph-redHover text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                Tolak & Kembalikan
              </button>
              <button 
                onClick={() => setReviewingRpsId(null)}
                className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
              >
                Setujui Dokumen
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
}
