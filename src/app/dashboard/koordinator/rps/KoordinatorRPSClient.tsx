"use client";

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import {
  FileText, CheckCircle, Download, Inbox,
  ChevronDown, ChevronUp, AlertCircle, FileArchive, Activity, X, XCircle, Mail,
  PenLine, Stamp,
} from 'lucide-react';
import type { RpsSubmission, RpsAssignment, RpsApiResponse } from '@/lib/api-types';
import { SyncIndicator } from '@/components/SyncIndicator';
import { SignaturePad } from '@/components/SignaturePad';
import type { SignaturePosition } from '@/components/PdfSignatureOverlay';

// Disable SSR for PDF components - pdfjs-dist requires browser APIs
const PdfSignatureOverlay = dynamic(
  () => import('@/components/PdfSignatureOverlay').then(m => m.PdfSignatureOverlay),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Memuat viewer PDF…</div> }
);

const PdfAnnotationViewer = dynamic(
  () => import('@/components/PdfAnnotationViewer').then(m => m.PdfAnnotationViewer),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[500px] text-gray-400 text-sm">Memuat anotator PDF…</div> }
);

type Submission = RpsSubmission;
type Assignment = RpsAssignment;

type DosenGroup = {
  name: string; totalMatkul: number; approved: number; progress: number;
  courses: { matkulName: string; status: string; isKoordinatorApproved: boolean }[];
};

type Props = { submissions: Submission[]; assignments: Assignment[] };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getKoordinatorView(status: string, isKoordinatorApproved: boolean) {
  if (status === 'SUBMITTED' && !isKoordinatorApproved) return 'NEEDS_REVIEW';
  if (status === 'PENGECEKAN' && !isKoordinatorApproved) return 'IN_REVIEW';
  if ((status === 'SUBMITTED' || status === 'PENGECEKAN') && isKoordinatorApproved) return 'KOOR_APPROVED';
  if (status === 'REVISION') return 'REVISION';
  if (status === 'APPROVED' && isKoordinatorApproved) return 'COMPLETED';
  return status;
}

export function KoordinatorRPSClient({ submissions: initialSubmissions, assignments }: Props) {
  const { data, mutate, isValidating, error } = useSWR<RpsApiResponse>(
    '/api/rps',
    fetcher,
    {
      fallbackData: { submissions: initialSubmissions, assignments },
      refreshInterval: 5000,
    }
  );

  const submissions = data?.submissions ?? initialSubmissions;
  const [activeTab, setActiveTab] = useState('review');
  const [expandedDosen, setExpandedDosen] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Signature state
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [sigPosition, setSigPosition] = useState<SignaturePosition>({ x: 5, y: 75, page: 1, width: 22 });
  const [signStep, setSignStep] = useState<'review' | 'sign'>('review');
  // Saved signature from user profile
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/users/me/signature')
      .then(r => r.json())
      .then((d: { savedSignature: string | null }) => setSavedSignature(d.savedSignature))
      .catch(() => {});
  }, []);

  const dosenGroups: DosenGroup[] = useMemo(() => {
    const dosenMap = new Map<string, { name: string; matkuls: { matkulName: string; status: string; isKoordinatorApproved: boolean }[] }>();
    for (const a of assignments) {
      if (!dosenMap.has(a.dosenName)) dosenMap.set(a.dosenName, { name: a.dosenName, matkuls: [] });
      const live = a.rpsId ? submissions.find(s => s.id === a.rpsId) : null;
      dosenMap.get(a.dosenName)!.matkuls.push({
        matkulName: a.matkulName,
        status: live ? live.status : a.defaultStatus,
        isKoordinatorApproved: live ? live.isKoordinatorApproved : false,
      });
    }
    return Array.from(dosenMap.values()).map(d => ({
      name: d.name,
      totalMatkul: d.matkuls.length,
      approved: d.matkuls.filter(m => m.status === 'APPROVED').length,
      progress: Math.round((d.matkuls.filter(m => m.status === 'APPROVED').length / d.matkuls.length) * 100) || 0,
      courses: d.matkuls,
    }));
  }, [submissions, assignments]);

  const needsReview = submissions.filter(s => s.status === 'SUBMITTED' && !s.isKoordinatorApproved);
  const pendingRevision = submissions.filter(s => s.status === 'REVISION');
  const archived = submissions.filter(s => s.status === 'APPROVED' && s.isKoordinatorApproved);
  const reviewingObj = submissions.find(s => s.id === reviewingId);

  function openReviewModal(rpsId: string) {
    setReviewingId(rpsId);
    setRevisionNote('');
    setSignatureDataUrl(null);
    setSigPosition({ x: 5, y: 75, page: 1, width: 22 });
    setSignStep('review');
  }

  function closeModal() {
    setReviewingId(null);
    setSignatureDataUrl(null);
    setSignStep('review');
  }

  function getStatusBadge(status: string, isKoordinatorApproved: boolean) {
    const view = getKoordinatorView(status, isKoordinatorApproved);
    switch (view) {
      case 'NEEDS_REVIEW': return <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">Needs Review</span>;
      case 'IN_REVIEW': return <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded text-xs font-bold">In Review</span>;
      case 'KOOR_APPROVED': return <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-bold">Disetujui Koordinator</span>;
      case 'REVISION': return <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-bold">Revisi</span>;
      case 'COMPLETED': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Selesai</span>;
      case 'UNSUBMITTED': return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">Belum Submit</span>;
      default: return null;
    }
  }

  async function handleReject() {
    if (!reviewingId) return;
    if (!revisionNote.trim()) { alert('Harap isi catatan revisi sebelum menolak.'); return; }
    setIsSaving(true);
    // Flatten annotations into PDF before sending back to dosen
    await fetch(`/api/rps/${reviewingId}/annotations/flatten`, { method: 'POST' });
    const res = await fetch(`/api/rps/${reviewingId}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer: 'koordinator', action: 'reject', notes: revisionNote }),
    });
    if (res.ok) { closeModal(); mutate(); }
    setIsSaving(false);
  }

  async function handleSaveSignature(dataUrl: string) {
    const res = await fetch('/api/users/me/signature', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedSignature: dataUrl }),
    });
    if (res.ok) {
      setSavedSignature(dataUrl);
    }
  }

  async function handleStampAndApprove() {
    if (!reviewingId || !signatureDataUrl) {
      alert('Harap buat tanda tangan terlebih dahulu.');
      return;
    }
    setIsSaving(true);
    const res = await fetch(`/api/rps/${reviewingId}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewer: 'koordinator',
        sigData: signatureDataUrl,
        sigX: sigPosition.x,
        sigY: sigPosition.y,
        sigPage: sigPosition.page,
        sigWidth: sigPosition.width,
      }),
    });
    if (res.ok) {
      const approvedId = reviewingId;
      closeModal();
      // Optimistic update: immediately mark as koordinator-approved so the item
      // disappears from the "Needs Review" list without waiting for the next poll.
      mutate(
        (prev: import('@/lib/api-types').RpsApiResponse | undefined) =>
          prev?.submissions
            ? {
                ...prev,
                submissions: prev.submissions.map(s =>
                  s.id === approvedId ? { ...s, isKoordinatorApproved: true } : s
                ),
              }
            : prev,
        { revalidate: true }
      );
    } else {
      const errData = await res.json().catch(() => ({}));
      alert(`Gagal: ${errData.error ?? 'Terjadi kesalahan saat menandatangani.'}`);
    }
    setIsSaving(false);
  }

  const isPdf = reviewingObj?.fileUrl?.toLowerCase().endsWith('.pdf');

  return (
    <>
      <div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Kelola RPS</h1>
        <p className="text-gray-500 mb-8">Periksa dan verifikasi dokumen RPS dari dosen sebelum diteruskan ke Kaprodi.</p>

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
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Status</th>
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
                      <td className="py-4 px-6">{getStatusBadge(rps.status, rps.isKoordinatorApproved)}</td>
                      <td className="py-4 px-6 text-center">
                        <button onClick={() => openReviewModal(rps.id)}
                          className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                          <FileText size={14} className="mr-1.5" /> Review & Tanda Tangan
                        </button>
                      </td>
                    </tr>
                  ))}
                  {needsReview.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-400">Tidak ada dokumen baru untuk direview.</td></tr>
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
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase w-2/5">Catatan Revisi</th>
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingRevision.map(rps => {
                    const rejectedBy = rps.kaprodiNotes ? 'Kaprodi' : rps.koordinatorNotes ? 'Koordinator' : null;
                    const note = rps.kaprodiNotes ?? rps.koordinatorNotes ?? null;
                    return (
                      <tr key={rps.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-4 px-6">
                          <h3 className="font-bold text-gray-800 mb-0.5">{rps.matkulName}</h3>
                          <span className="text-sm text-gray-500">{rps.dosenName}</span>
                        </td>
                        <td className="py-4 px-6">
                          {rejectedBy && note ? (
                            <div className="bg-orange-50 border border-orange-100 rounded-md p-2.5">
                              <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Ditolak oleh {rejectedBy}</p>
                              <p className="text-xs text-orange-800 italic">"{note}"</p>
                            </div>
                          ) : <span className="text-sm text-gray-400 italic">Tidak ada catatan.</span>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button className="inline-flex items-center px-4 py-2 border border-orange-500 text-orange-600 hover:bg-orange-50 text-xs font-bold rounded-lg transition-colors">
                            <Mail size={14} className="mr-1.5" /> Kirim Pengingat
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {pendingRevision.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-400">Tidak ada revisi tertunda.</td></tr>
                  )}
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
                                <tr key={i} className={`border-b border-gray-100/50 last:border-0 ${c.status === 'UNSUBMITTED' ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-white'}`}>
                                  <td className="py-3 px-4 font-semibold text-gray-700">{c.matkulName}</td>
                                  <td className="py-3 px-4">{getStatusBadge(c.status, c.isKoordinatorApproved)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
                {dosenGroups.length === 0 && (
                  <p className="text-center text-gray-400 py-8">Tidak ada dosen yang terkoordinasi.</p>
                )}
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
                        {(rps.finalPdfUrl ?? rps.fileUrl) && (
                          <a href={rps.finalPdfUrl ?? rps.fileUrl!} className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors">
                            <Download size={14} className="mr-1.5" /> Download
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                  {archived.length === 0 && (
                    <tr><td colSpan={3} className="py-8 text-center text-gray-400">Belum ada dokumen yang selesai.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Review & Signature Modal ── */}
      {reviewingObj && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-4 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {signStep === 'review' ? 'Review Dokumen RPS' : 'Tambah Tanda Tangan Digital'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {reviewingObj.matkulName} &bull; {reviewingObj.dosenName}
                </p>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>

            {/* Step indicator */}
            <div className="flex border-b border-gray-100">
              {(['review', 'sign'] as const).map((step, i) => (
                <div key={step} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-colors ${signStep === step ? 'border-uph-blue text-uph-blue bg-blue-50/30' : 'border-transparent text-gray-400'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${signStep === step ? 'bg-uph-blue text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
                  {step === 'review' ? 'Tinjau Dokumen' : 'Tanda Tangan & Stamp'}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {signStep === 'review' && (
                <div className="space-y-5">
                  {/* Document info */}
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center">
                    <div className="flex items-center">
                      <FileText className="text-uph-blue mr-3" size={24} />
                      <div>
                        <p className="font-bold text-uph-blue text-sm">{reviewingObj.fileName ?? 'File tidak tersedia'}</p>
                        <p className="text-xs text-blue-600">Dokumen siap untuk direview.</p>
                      </div>
                    </div>
                    {reviewingObj.fileUrl && (
                      <a href={reviewingObj.fileUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-uph-blue text-white hover:bg-[#111c33] text-sm font-bold rounded-lg transition-colors shadow-sm">
                        <Download size={16} className="mr-1.5" /> Download & Buka
                      </a>
                    )}
                  </div>

                  {/* PDF Annotation Viewer */}
                  {isPdf && reviewingObj.fileUrl && reviewingId && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-gray-700">Anotasi Dokumen</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Tambahkan catatan langsung pada PDF sebelum menolak
                        </span>
                      </div>
                      <PdfAnnotationViewer
                        pdfUrl={reviewingObj.fileUrl}
                        rpsId={reviewingId}
                        readOnly={false}
                        reviewerRole="koordinator"
                      />
                    </div>
                  )}

                  {/* Rejection notes */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Catatan Revisi <span className="text-red-500 font-normal">(wajib diisi jika menolak)</span>
                    </label>
                    <textarea
                      value={revisionNote}
                      onChange={e => setRevisionNote(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-uph-blue text-sm min-h-[100px]"
                      placeholder="Tuliskan masukan spesifik mengapa RPS ini perlu direvisi..."
                    />
                  </div>
                </div>
              )}

              {signStep === 'sign' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Signature pad */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <PenLine size={16} className="text-uph-blue" /> Buat Tanda Tangan
                      </h3>
                      <SignaturePad
                        onSignatureChange={setSignatureDataUrl}
                        savedSignature={savedSignature}
                        onSaveSignature={handleSaveSignature}
                      />
                      {signatureDataUrl && (
                        <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                          <CheckCircle size={12} /> Tanda tangan siap. Seret ke posisi di PDF.
                        </p>
                      )}
                    </div>

                    {/* Right: Instructions */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-amber-800 mb-2">Petunjuk Penandatanganan</h4>
                      <ol className="text-xs text-amber-700 space-y-1.5 list-decimal list-inside">
                        <li>Gambar tanda tangan Anda pada kanvas, atau upload gambar tanda tangan.</li>
                        <li>Setelah tanda tangan muncul di preview PDF, seret (drag) ke posisi yang diinginkan.</li>
                        <li>Gunakan handle sudut kanan-bawah untuk mengubah ukuran tanda tangan.</li>
                        <li>Gunakan navigasi halaman untuk pindah ke halaman yang tepat.</li>
                        <li>Klik <strong>Stamp & Setujui</strong> untuk menyimpan.</li>
                      </ol>
                    </div>
                  </div>

                  {/* PDF + overlay */}
                  {reviewingObj.fileUrl && isPdf && (
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Stamp size={16} className="text-uph-blue" /> Posisikan Tanda Tangan pada PDF
                      </h3>
                      <PdfSignatureOverlay
                        pdfUrl={reviewingObj.fileUrl}
                        signatureDataUrl={signatureDataUrl}
                        position={sigPosition}
                        onPositionChange={setSigPosition}
                      />
                    </div>
                  )}

                  {reviewingObj.fileUrl && !isPdf && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                      <p className="font-bold mb-1">File bukan PDF - preview tidak tersedia</p>
                      <p className="text-xs mb-3">Dokumen diunggah dalam format Word/DOCX dan konversi otomatis gagal. Harap unduh, periksa secara manual, lalu tanda tangani setelah Dosen mengunggah ulang dalam format PDF.</p>
                      <a href={reviewingObj.fileUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-amber-700 text-white text-xs font-bold rounded-lg hover:bg-amber-800 transition-colors">
                        <Download size={14} className="mr-1.5" /> Unduh File DOCX
                      </a>
                    </div>
                  )}

                  {!reviewingObj.fileUrl && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                      File PDF tidak tersedia. Pastikan dosen mengupload file PDF yang valid.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
              <div className="flex gap-2">
                {signStep === 'sign' && (
                  <button onClick={() => setSignStep('review')}
                    className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-colors">
                    ← Kembali
                  </button>
                )}
                <button onClick={closeModal}
                  className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-colors">
                  Batal
                </button>
              </div>

              <div className="flex gap-3">
                {signStep === 'review' && (
                  <>
                    <button onClick={handleReject} disabled={isSaving}
                      className="px-5 py-2.5 bg-uph-red hover:bg-[#9a0818] text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50">
                      <XCircle size={16} className="inline mr-1.5" /> Tolak & Kembalikan
                    </button>
                    <button onClick={() => setSignStep('sign')}
                      className="px-5 py-2.5 bg-uph-blue hover:bg-[#111c33] text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                      <PenLine size={16} className="inline mr-1.5" /> Lanjut: Tanda Tangan →
                    </button>
                  </>
                )}
                {signStep === 'sign' && (
                  <button onClick={handleStampAndApprove} disabled={isSaving || !signatureDataUrl || !isPdf}
                    className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                    <Stamp size={16} />
                    {isSaving ? 'Menyimpan…' : 'Stamp & Setujui Dokumen'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <SyncIndicator isValidating={isValidating} error={error} />
    </>
  );
}
