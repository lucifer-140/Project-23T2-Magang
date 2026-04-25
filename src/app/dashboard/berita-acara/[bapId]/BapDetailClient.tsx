"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Upload, FileText, CheckCircle, Clock, AlertCircle,
  XCircle, Loader2, Download, Users, ChevronRight, ExternalLink,
} from 'lucide-react';

interface Bap {
  id: string;
  kelasId: string;
  isUnlocked: boolean;
  kelas: { id: string; name: string; dosenPaId: string; dosenPa: { id: string; name: string } };
  semesterId: string;
  semester: { id: string; nama: string; tahunAkademik: { id: string; tahun: string } };
  lembarKehadiranUrl: string | null;
  lembarKehadiranName: string | null;
  absensiUrl: string | null;
  absensiName: string | null;
  beritaAcaraUrl: string | null;
  beritaAcaraName: string | null;
  status: string;
  isProdiApproved: boolean;
  prodiNotes: string | null;
  kaprodiNotes: string | null;
  createdAt: string;
  updatedAt: string;
  finalApprovedAt: string | null;
}

interface Props {
  bap: Bap;
  isKaprodi: boolean;
  isProdi: boolean;
  isDosenPa: boolean;
}

const SLOTS = [
  { key: 'lembarKehadiran', label: 'Lembar Kehadiran Pembimbing', hint: 'Daftar hadir pembimbing akademik' },
  { key: 'absensi', label: 'Absensi Mahasiswa', hint: 'NIM, nama, keterangan hadir/tidak' },
  { key: 'beritaAcara', label: 'Berita Acara', hint: 'Dokumentasi & bukti screenshot perwalian' },
] as const;

type SlotKey = typeof SLOTS[number]['key'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

// ── Progress Stepper ──────────────────────────────────────────────────────────
function Stepper({ status, uploadedCount }: { status: string; uploadedCount: number }) {
  const step = status === 'APPROVED' ? 3 : status === 'SUBMITTED' ? 2 : 1;
  const steps = [
    { n: 1, label: 'Upload Dokumen', sub: `${uploadedCount}/3 file` },
    { n: 2, label: 'Menunggu Review', sub: 'Kaprodi memeriksa' },
    { n: 3, label: 'Selesai', sub: 'BAP disetujui' },
  ];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                done ? 'bg-green-500 text-white' : active ? 'bg-uph-blue text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? <CheckCircle size={18} /> : s.n}
              </div>
              <span className={`text-xs font-semibold text-center leading-tight ${active ? 'text-uph-blue' : done ? 'text-green-600' : 'text-gray-400'}`}>{s.label}</span>
              <span className={`text-[10px] text-center ${active ? 'text-gray-500' : done ? 'text-green-500' : 'text-gray-300'}`}>{s.sub}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-7 rounded ${done || (active && step > s.n) ? 'bg-green-400' : step > s.n ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'APPROVED') return <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700 border border-green-200"><CheckCircle size={14} /> Disetujui Kaprodi</span>;
  if (status === 'REVISION') return <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200"><AlertCircle size={14} /> Perlu Revisi</span>;
  if (status === 'SUBMITTED') return <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200"><Clock size={14} /> Menunggu Kaprodi</span>;
  return <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200"><XCircle size={14} /> Belum Lengkap</span>;
}

export default function BapDetailClient({ bap: initialBap, isKaprodi, isProdi, isDosenPa }: Props) {
  const router = useRouter();
  const [bap, setBap] = useState(initialBap);
  const [uploadingSlot, setUploadingSlot] = useState<SlotKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showSubmitBanner, setShowSubmitBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<SlotKey | null>(null);
  const prevStatus = useRef(initialBap.status);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(id);
  }, [router]);

  // Detect manual submit transition → show banner
  useEffect(() => {
    if (prevStatus.current !== 'SUBMITTED' && bap.status === 'SUBMITTED') {
      setShowSubmitBanner(true);
    }
    prevStatus.current = bap.status;
  }, [bap.status]);

  const handleSubmit = async () => {
    setSubmitLoading(true);
    const res = await fetch(`/api/bap/${bap.id}/submit`, { method: 'POST' });
    setSubmitLoading(false);
    if (res.ok) {
      const data = await res.json();
      setBap(prev => ({ ...prev, ...data }));
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? 'Gagal mengajukan BAP');
    }
  };

  const uploadedCount = [bap.lembarKehadiranUrl, bap.absensiUrl, bap.beritaAcaraUrl].filter(Boolean).length;
  const locked = !bap.isUnlocked || bap.status === 'SUBMITTED' || bap.status === 'APPROVED';

  const handleUpload = (slot: SlotKey) => {
    if (locked) return;
    setPendingSlot(slot);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingSlot) return;
    e.target.value = '';
    setUploadingSlot(pendingSlot);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('slot', pendingSlot);
    const res = await fetch(`/api/bap/${bap.id}/upload`, { method: 'POST', body: fd });
    setUploadingSlot(null);
    if (res.ok) setBap(await res.json());
    else alert('Gagal upload file');
    setPendingSlot(null);
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setShowApproveModal(false);
    const res = await fetch(`/api/bap/${bap.id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer: 'kaprodi', action: 'approve' }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setBap(prev => ({ ...prev, ...data }));
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? 'Gagal');
    }
  };

  const handleReject = async () => {
    if (!rejectNotes.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/bap/${bap.id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer: 'kaprodi', action: 'reject', notes: rejectNotes }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setBap(prev => ({ ...prev, ...data }));
      setShowRejectForm(false);
      setRejectNotes('');
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? 'Gagal');
    }
  };

  const canKaprodiReview = isKaprodi && bap.status === 'SUBMITTED';

  return (
    <div className="max-w-2xl mx-auto">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />

      {/* Approve confirm modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-playfair text-lg font-bold text-gray-900 mb-1">Setujui BAP ini?</h3>
              <p className="text-sm text-gray-500">Kelas <strong>{bap.kelas.name}</strong> — {bap.semester.nama}.<br />Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleApprove} disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50">
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Ya, Setujui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => router.push(`/dashboard/berita-acara/kelas/${bap.kelas.id}/${bap.semester.tahunAkademik.id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-uph-blue mb-5 transition-colors">
        <ArrowLeft size={14} /> Kembali ke Daftar Semester
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-uph-blue">Kelas {bap.kelas.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{bap.semester.tahunAkademik.tahun} — {bap.semester.nama}</p>
        </div>
        <StatusBadge status={bap.status} />
      </div>

      {/* Info row */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Users size={14} className="text-uph-blue" />
        <span>Dosen PA: <strong className="text-gray-800">{bap.kelas.dosenPa.name}</strong></span>
      </div>

      {/* ── Dosen PA view ──────────────────────────────────────── */}
      {isDosenPa && (
        <>
          {/* Progress stepper */}
          <Stepper status={bap.status} uploadedCount={uploadedCount} />

          {/* Auto-submit success banner */}
          {showSubmitBanner && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800">Semua dokumen berhasil diupload!</p>
                <p className="text-xs text-green-600 mt-0.5">BAP Anda telah otomatis diajukan ke Kaprodi untuk direview.</p>
              </div>
              <button onClick={() => setShowSubmitBanner(false)} className="text-green-400 hover:text-green-600 text-lg leading-none">&times;</button>
            </div>
          )}

          {/* Status banners */}
          {!bap.isUnlocked && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
              <Clock size={18} className="text-amber-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Akses belum dibuka</p>
                <p className="text-xs text-amber-600 mt-0.5">Kaprodi belum membuka akses upload untuk semester ini.</p>
              </div>
            </div>
          )}

          {bap.status === 'SUBMITTED' && !showSubmitBanner && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
              <Clock size={18} className="text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Sedang direview oleh Kaprodi</p>
                <p className="text-xs text-blue-600 mt-0.5">Dokumen tidak dapat diubah saat dalam proses review.</p>
              </div>
            </div>
          )}

          {bap.status === 'REVISION' && bap.kaprodiNotes && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-red-500" />
                <p className="text-sm font-bold text-red-700">Catatan dari Kaprodi</p>
              </div>
              <p className="text-sm text-red-700 leading-relaxed">"{bap.kaprodiNotes}"</p>
              <p className="text-xs text-red-500 mt-2">Silakan upload ulang dokumen yang perlu diperbaiki.</p>
            </div>
          )}

          {/* Approved state */}
          {bap.status === 'APPROVED' ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={36} className="text-green-600" />
              </div>
              <h2 className="font-playfair text-xl font-bold text-green-800 mb-1">BAP Anda Telah Disetujui!</h2>
              {bap.finalApprovedAt && (
                <p className="text-sm text-green-600">Disetujui pada {fmtDate(bap.finalApprovedAt)}</p>
              )}
              <div className="mt-6 space-y-2">
                {SLOTS.map(({ key, label }) => {
                  const url = bap[`${key}Url` as keyof Bap] as string | null;
                  const name = bap[`${key}Name` as keyof Bap] as string | null;
                  if (!url) return null;
                  return (
                    <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between bg-white border border-green-200 rounded-xl px-4 py-3 hover:bg-green-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-green-600" />
                        <div className="text-left">
                          <p className="text-xs font-bold text-gray-700">{label}</p>
                          {name && <p className="text-xs text-gray-400 truncate max-w-xs">{name}</p>}
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-green-500 group-hover:text-green-700" />
                    </a>
                  );
                })}
              </div>
            </div>
          ) : (
            /* File slots — dosen PA upload view */
            <div className="space-y-3 mb-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Dokumen</h2>
              {SLOTS.map(({ key, label, hint }) => {
                const url = bap[`${key}Url` as keyof Bap] as string | null;
                const name = bap[`${key}Name` as keyof Bap] as string | null;
                const isUploading = uploadingSlot === key;
                const uploaded = !!url;
                return (
                  <div key={key} className={`bg-white rounded-xl border-2 px-5 py-4 transition-all ${
                    isUploading ? 'border-uph-blue/40 bg-blue-50/30' :
                    uploaded ? 'border-green-300 bg-green-50/20' :
                    'border-dashed border-gray-300'
                  }`}>
                    <div className="flex items-center gap-4">
                      {/* Status icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isUploading ? 'bg-blue-100' : uploaded ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {isUploading
                          ? <Loader2 size={22} className="text-uph-blue animate-spin" />
                          : uploaded
                            ? <CheckCircle size={22} className="text-green-600" />
                            : <FileText size={22} className="text-gray-300" />}
                      </div>

                      {/* Label + filename */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800">{label}</p>
                        {uploaded
                          ? <p className="text-xs text-green-600 font-medium mt-0.5 truncate">{name}</p>
                          : <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {url && (
                          <a href={url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border border-uph-blue text-uph-blue rounded-lg hover:bg-blue-50 transition-colors">
                            <Download size={12} /> Lihat
                          </a>
                        )}
                        {!locked && (
                          <button onClick={() => handleUpload(key)} disabled={isUploading}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              uploaded
                                ? 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                                : 'bg-uph-blue text-white hover:bg-uph-blue/90'
                            }`}>
                            <Upload size={12} />
                            {uploaded ? 'Ganti' : 'Upload'}
                          </button>
                        )}
                        {locked && bap.status === 'SUBMITTED' && (
                          <span className="text-xs text-blue-500 font-medium bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                            Dalam review
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Submit button — show when all 3 uploaded and not yet submitted */}
          {bap.isUnlocked && uploadedCount === 3 && (bap.status === 'UNSUBMITTED' || bap.status === 'REVISION') && (
            <div className="bg-uph-blue/5 border-2 border-uph-blue/20 rounded-2xl px-5 py-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-uph-blue">Semua dokumen siap</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {bap.status === 'REVISION'
                    ? 'Kirim kembali ke Kaprodi setelah memperbaiki dokumen.'
                    : 'Ajukan BAP ke Kaprodi untuk direview.'}
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitLoading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-uph-blue rounded-xl hover:bg-uph-blue/90 disabled:opacity-50 transition-colors flex-shrink-0 shadow-sm">
                {submitLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                {bap.status === 'REVISION' ? 'Kirim Ulang ke Kaprodi' : 'Ajukan ke Kaprodi'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Kaprodi view ──────────────────────────────────────── */}
      {isKaprodi && (
        <div className="space-y-4">
          {/* Document review section */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Dokumen yang Diajukan</h2>
            {bap.status === 'SUBMITTED' && (
              <p className="text-xs text-gray-400 mb-3">Diajukan {timeAgo(bap.updatedAt)} — {fmtDate(bap.updatedAt)}</p>
            )}
            <div className="space-y-2">
              {SLOTS.map(({ key, label }) => {
                const url = bap[`${key}Url` as keyof Bap] as string | null;
                const name = bap[`${key}Name` as keyof Bap] as string | null;
                return (
                  <div key={key} className={`bg-white rounded-xl border px-5 py-3.5 flex items-center gap-4 ${url ? 'border-green-200' : 'border-gray-200 opacity-60'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${url ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {url ? <CheckCircle size={16} className="text-green-600" /> : <XCircle size={16} className="text-gray-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700">{label}</p>
                      {name && <p className="text-xs text-gray-400 truncate mt-0.5">{name}</p>}
                    </div>
                    {url && (
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-uph-blue/10 text-uph-blue rounded-lg hover:bg-uph-blue/20 transition-colors flex-shrink-0">
                        Buka <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review panel */}
          {canKaprodiReview && (
            <div className="bg-white border-2 border-uph-blue/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-uph-blue/10 flex items-center justify-center">
                  <CheckCircle size={16} className="text-uph-blue" />
                </div>
                <h2 className="font-bold text-gray-800">Keputusan Review</h2>
              </div>

              {showRejectForm ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">Catatan Penolakan</label>
                    <textarea
                      rows={3}
                      value={rejectNotes}
                      onChange={e => setRejectNotes(e.target.value)}
                      placeholder="Jelaskan alasan penolakan atau dokumen yang perlu diperbaiki..."
                      className="w-full border border-uph-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-uph-red/30 resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">Catatan ini akan dikirim ke Dosen PA.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowRejectForm(false); setRejectNotes(''); }}
                      className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                      Batal
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={submitting || !rejectNotes.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-uph-red rounded-xl hover:bg-uph-red/90 disabled:opacity-50">
                      {submitting && <Loader2 size={14} className="animate-spin" />}
                      Tolak & Kembalikan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-uph-red border-2 border-uph-red/30 rounded-xl hover:bg-red-50 transition-colors">
                    <XCircle size={16} /> Tolak
                  </button>
                  <button
                    onClick={() => setShowApproveModal(true)}
                    disabled={submitting}
                    className="flex-2 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    Setujui BAP
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Approved state for kaprodi */}
          {bap.status === 'APPROVED' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-800">BAP telah disetujui</p>
                {bap.finalApprovedAt && <p className="text-xs text-green-600 mt-0.5">{fmtDate(bap.finalApprovedAt)}</p>}
              </div>
            </div>
          )}

          {/* Revision state for kaprodi */}
          {bap.status === 'REVISION' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Dikembalikan untuk revisi</p>
                {bap.kaprodiNotes && <p className="text-xs text-amber-700 mt-0.5">"{bap.kaprodiNotes}"</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Neutral view (PRODI or other) ──────────────────────── */}
      {!isDosenPa && !isKaprodi && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Dokumen</h2>
          {SLOTS.map(({ key, label }) => {
            const url = bap[`${key}Url` as keyof Bap] as string | null;
            const name = bap[`${key}Name` as keyof Bap] as string | null;
            return (
              <div key={key} className={`bg-white rounded-xl border px-5 py-4 flex items-center gap-4 ${url ? 'border-green-200' : 'border-dashed border-gray-200'}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${url ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {url ? <CheckCircle size={18} className="text-green-600" /> : <FileText size={18} className="text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700">{label}</p>
                  {name && <p className="text-xs text-gray-400 truncate mt-0.5">{name}</p>}
                </div>
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border border-uph-blue text-uph-blue rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0">
                    <Download size={12} /> Lihat
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
