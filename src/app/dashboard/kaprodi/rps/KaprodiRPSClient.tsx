"use client";

import { useState } from 'react';
import {
  FileText, Clock, CheckCircle, Mail, Download, Inbox,
  ChevronDown, ChevronUp, AlertCircle, FileArchive, Activity, X, XCircle
} from 'lucide-react';

type Submission = {
  id: string; matkulName: string; matkulCode: string; dosenName: string;
  status: string; fileName: string | null; fileUrl: string | null;
  notes: string | null; createdAt: string; updatedAt: string;
};

type DosenGroup = {
  name: string; totalMatkul: number; approved: number; progress: number;
  courses: { matkulName: string; status: string }[];
};

type Props = { submissions: Submission[]; dosenGroups: DosenGroup[] };

export function KaprodiRPSClient({ submissions: initialData, dosenGroups }: Props) {
  const [submissions, setSubmissions] = useState(initialData);
  const [activeTab, setActiveTab] = useState('review');
  const [expandedDosen, setExpandedDosen] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const needsReview = submissions.filter(s => s.status === 'SUBMITTED');
  const pendingRevision = submissions.filter(s => s.status === 'REVISION');
  const archived = submissions.filter(s => s.status === 'APPROVED');
  const reviewingObj = submissions.find(s => s.id === reviewingId);

  function getStatusBadge(status: string) {
    switch (status) {
      case 'UNSUBMITTED': return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">BELUM SUBMIT</span>;
      case 'SUBMITTED': return <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-bold">NEEDS REVIEW</span>;
      case 'PENGECEKAN': return <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded text-xs font-bold">IN REVIEW</span>;
      case 'REVISION': return <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-bold">REVISION</span>;
      case 'APPROVED': return <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-bold">APPROVED</span>;
      default: return null;
    }
  }

  async function handleAction(action: 'approve' | 'reject') {
    if (!reviewingId) return;
    if (action === 'reject' && !revisionNote.trim()) {
      alert('Harap isi catatan revisi sebelum menolak.');
      return;
    }
    setIsSaving(true);
    const res = await fetch(`/api/rps/${reviewingId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, notes: revisionNote }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSubmissions(prev => prev.map(s => s.id === reviewingId ? { ...s, ...updated } : s));
      setReviewingId(null);
      setRevisionNote('');
    }
    setIsSaving(false);
  }

  return (
    <>
      <div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Evaluasi RPS</h1>
        <p className="text-gray-500 mb-8">Pantau dan verifikasi pengajuan RPS dari para dosen.</p>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {[
            { key: 'review', label: 'Needs Review', icon: <Inbox size={16} />, count: needsReview.length, color: 'border-uph-blue text-uph-blue', badgeColor: 'bg-uph-blue' },
            { key: 'revision', label: 'Menunggu Revisi', icon: <AlertCircle size={16} />, count: pendingRevision.length, color: 'border-orange-500 text-orange-600', badgeColor: 'bg-orange-500' },
            { key: 'directory', label: 'Direktori Dosen', icon: <Activity size={16} />, count: null, color: 'border-uph-blue text-uph-blue', badgeColor: '' },
            { key: 'archive', label: 'Arsip Terverifikasi', icon: <FileArchive size={16} />, count: archived.length, color: 'border-green-500 text-green-600', badgeColor: 'bg-green-500' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.key ? tab.color : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full text-white ${tab.badgeColor}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab: Needs Review */}
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
                  {needsReview.map(rps => (
                    <tr key={rps.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <span className="font-bold text-gray-800">{rps.matkulName}</span>
                        <span className="ml-2 text-xs text-uph-blue bg-uph-blue/10 px-1.5 py-0.5 rounded uppercase">{rps.matkulCode}</span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-600">{rps.dosenName}</td>
                      <td className="py-4 px-6">
                        <span className="flex items-center text-sm font-semibold text-gray-700 bg-gray-100 w-fit px-2 py-1 rounded">
                          <Clock size={12} className="mr-1.5 text-gray-400" />
                          {new Date(rps.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button onClick={() => { setReviewingId(rps.id); setRevisionNote(''); }}
                          className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                          <FileText size={14} className="mr-1.5" /> Review Dokumen
                        </button>
                      </td>
                    </tr>
                  ))}
                  {needsReview.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-400">Tidak ada dokumen baru.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab: Revision */}
          {activeTab === 'revision' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Mata Kuliah & Dosen</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase w-1/3">Catatan Revisi</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingRevision.map(rps => (
                    <tr key={rps.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <h3 className="font-bold text-gray-800 mb-0.5">{rps.matkulName}</h3>
                        <span className="text-sm text-gray-500">{rps.dosenName}</span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="bg-orange-50 text-orange-800 text-xs p-2 rounded-md border border-orange-100 italic">
                          "{rps.notes}"
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button className="inline-flex items-center px-4 py-2 border border-orange-500 text-orange-600 hover:bg-orange-50 text-xs font-bold rounded-lg transition-colors">
                          <Mail size={14} className="mr-1.5" /> Kirim Pengingat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab: Directory */}
          {activeTab === 'directory' && (
            <div className="p-4">
              <div className="flex flex-col gap-3">
                {dosenGroups.map((dosen, idx) => {
                  const isExpanded = expandedDosen === dosen.name;
                  const progressColor = dosen.progress === 100 ? 'bg-green-500' : dosen.progress > 0 ? 'bg-uph-blue' : 'bg-gray-200';
                  return (
                    <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedDosen(isExpanded ? null : dosen.name)}>
                        <div className="flex-1 flex justify-between items-center pr-6">
                          <div className="w-1/3">
                            <h3 className="font-bold text-gray-800 text-sm">{dosen.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{dosen.totalMatkul} Mata Kuliah</p>
                          </div>
                          <div className="w-1/3 flex justify-center">
                            <div className="w-full max-w-[150px]">
                              <div className="flex justify-between text-xs font-semibold mb-1">
                                <span className="text-gray-500">Progress</span>
                                <span className="text-gray-800">{dosen.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className={`${progressColor} h-2 rounded-full`} style={{ width: `${dosen.progress}%` }} />
                              </div>
                            </div>
                          </div>
                          <div className="w-1/3 flex justify-end">
                            <button className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors" onClick={e => e.stopPropagation()}>
                              <Mail size={14} className="mr-1.5" /> Email Dosen
                            </button>
                          </div>
                        </div>
                        <div className="text-gray-400">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                          <table className="w-full text-sm text-left">
                            <thead>
                              <tr className="text-gray-500 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                                <th className="py-2 px-4">Mata Kuliah</th>
                                <th className="py-2 px-4">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dosen.courses.map((c, i) => (
                                <tr key={i} className="border-b border-gray-100/50 last:border-0 hover:bg-white">
                                  <td className="py-3 px-4 font-semibold text-gray-700">{c.matkulName}</td>
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

          {/* Tab: Archive */}
          {activeTab === 'archive' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Mata Kuliah / Dosen</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">File</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {archived.map(rps => (
                    <tr key={rps.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="py-4 px-6">
                        <h3 className="font-bold text-gray-800 mb-0.5">{rps.matkulName}</h3>
                        <span className="text-sm text-gray-500 flex items-center">
                          <CheckCircle size={12} className="mr-1 text-green-500" /> {rps.dosenName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-uph-blue">{rps.fileName}</td>
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
          )}
        </div>
      </div>

      {/* Review Modal */}
      {reviewingObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">Review Dokumen RPS</h2>
              <button onClick={() => setReviewingId(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mata Kuliah</h3>
                <p className="text-lg font-bold text-uph-blue">{reviewingObj.matkulName}</p>
                <div className="flex items-center text-sm font-medium text-gray-600 mt-1">
                  <span>Dosen: {reviewingObj.dosenName}</span>
                  <span className="mx-2">•</span>
                  <span>Kode: {reviewingObj.matkulCode}</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6 flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="text-uph-blue mr-3" size={24} />
                  <div>
                    <p className="font-bold text-uph-blue text-sm">{reviewingObj.fileName ?? 'File tidak tersedia'}</p>
                    <p className="text-xs text-blue-600">Dokumen PDF/Word siap untuk direview.</p>
                  </div>
                </div>
                {reviewingObj.fileUrl && (
                  <a href={reviewingObj.fileUrl} className="inline-flex items-center px-4 py-2 bg-uph-blue text-white hover:bg-[#111c33] text-sm font-bold rounded-lg transition-colors shadow-sm">
                    <Download size={16} className="mr-1.5" /> Download
                  </a>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Catatan Revisi <span className="text-red-500 font-normal">(wajib diisi jika menolak)</span>
                </label>
                <textarea
                  value={revisionNote}
                  onChange={e => setRevisionNote(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-uph-blue text-sm min-h-[120px]"
                  placeholder="Tuliskan masukan spesifik mengapa RPS ini perlu direvisi..."
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setReviewingId(null)} className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-colors">
                Batal
              </button>
              <button onClick={() => handleAction('reject')} disabled={isSaving}
                className="px-5 py-2.5 bg-uph-red hover:bg-uph-redHover text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50">
                <XCircle size={16} className="inline mr-1.5" /> Tolak & Kembalikan
              </button>
              <button onClick={() => handleAction('approve')} disabled={isSaving}
                className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50">
                <CheckCircle size={16} className="inline mr-1.5" /> Setujui Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
