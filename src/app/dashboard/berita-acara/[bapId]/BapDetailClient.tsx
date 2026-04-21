"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, CheckCircle, Clock, AlertCircle, XCircle, Loader2, Download, Users } from 'lucide-react';

interface Bap {
  id: string;
  kelasId: string;
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
  { key: 'lembarKehadiran', label: 'Lembar Kehadiran Pembimbing' },
  { key: 'absensi', label: 'Absensi (NIM, Nama, Hadir/Tidak)' },
  { key: 'beritaAcara', label: 'Berita Acara (Dosen Bicara Apa + Bukti Screenshot)' },
] as const;

type SlotKey = typeof SLOTS[number]['key'];

function StatusBadge({ status, isProdiApproved }: { status: string; isProdiApproved: boolean }) {
  if (status === 'APPROVED') return <span className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700"><CheckCircle size={14} /> Disetujui Kaprodi</span>;
  if (status === 'REVISION') return <span className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700"><AlertCircle size={14} /> Perlu Revisi</span>;
  if (status === 'PENGECEKAN') {
    if (isProdiApproved) return <span className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-700"><Clock size={14} /> Menunggu Kaprodi</span>;
    return <span className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700"><Clock size={14} /> Menunggu PRODI</span>;
  }
  if (status === 'SUBMITTED') return <span className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700"><Clock size={14} /> Diajukan</span>;
  return <span className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-500"><XCircle size={14} /> Belum Lengkap</span>;
}

export default function BapDetailClient({ bap: initialBap, isKaprodi, isProdi, isDosenPa }: Props) {
  const router = useRouter();
  const [bap, setBap] = useState(initialBap);
  const [uploadingSlot, setUploadingSlot] = useState<SlotKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState<'prodi' | 'kaprodi' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<SlotKey | null>(null);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(id);
  }, [router]);

  const locked = bap.status === 'SUBMITTED' || bap.status === 'PENGECEKAN' || bap.status === 'APPROVED';

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

  const handleReview = async (reviewer: 'prodi' | 'kaprodi', action: 'approve' | 'reject') => {
    if (action === 'reject' && !rejectNotes.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/bap/${bap.id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer, action, notes: rejectNotes }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setBap(prev => ({ ...prev, ...data }));
      setShowRejectForm(null);
      setRejectNotes('');
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? 'Gagal');
    }
  };

  const canProdiReview = isProdi && bap.status === 'SUBMITTED' && !bap.isProdiApproved;
  const canKaprodiReview = isKaprodi && bap.isProdiApproved && bap.status === 'PENGECEKAN';

  return (
    <div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />

      <button
        onClick={() => router.push(`/dashboard/berita-acara/kelas/${bap.kelas.id}/${bap.semester.tahunAkademik.id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-uph-blue mb-4 transition-colors">
        <ArrowLeft size={14} /> Kembali
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-uph-blue">Kelas {bap.kelas.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{bap.semester.tahunAkademik.tahun} — {bap.semester.nama}</p>
        </div>
        <StatusBadge status={bap.status} isProdiApproved={bap.isProdiApproved} />
      </div>

      {/* Info bar */}
      <div className="bg-white border border-uph-border rounded-xl px-5 py-4 mb-6 flex items-center gap-4">
        <Users size={20} className="text-uph-blue flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Dosen PA</p>
          <p className="font-bold text-gray-800">{bap.kelas.dosenPa.name}</p>
        </div>
      </div>

      {/* Rejection notes */}
      {bap.status === 'REVISION' && (
        <div className="space-y-2 mb-6">
          {bap.prodiNotes && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-bold text-red-600 mb-1">Catatan PRODI:</p>
              <p className="text-sm text-red-700">{bap.prodiNotes}</p>
            </div>
          )}
          {bap.kaprodiNotes && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-xs font-bold text-red-600 mb-1">Catatan Kaprodi:</p>
              <p className="text-sm text-red-700">{bap.kaprodiNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* File slots */}
      <div className="space-y-4 mb-6">
        <h2 className="font-bold text-gray-700">Dokumen</h2>
        {SLOTS.map(({ key, label }) => {
          const url = bap[`${key}Url` as keyof Bap] as string | null;
          const name = bap[`${key}Name` as keyof Bap] as string | null;
          const isUploading = uploadingSlot === key;
          return (
            <div key={key} className="bg-white border border-uph-border rounded-xl px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={18} className={url ? 'text-green-600' : 'text-gray-300'} />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{label}</p>
                    {name && <p className="text-xs text-gray-400 mt-0.5">{name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border border-uph-blue text-uph-blue rounded-lg hover:bg-blue-50 transition-colors">
                      <Download size={12} /> Lihat
                    </a>
                  )}
                  {isDosenPa && !locked && (
                    <button onClick={() => handleUpload(key)} disabled={isUploading}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-uph-blue text-white rounded-lg hover:bg-uph-blue/90 disabled:opacity-60 transition-colors">
                      {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      {url ? 'Ganti' : 'Upload'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review panel */}
      {(canProdiReview || canKaprodiReview) && (
        <div className="bg-white border border-uph-border rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-gray-700">{canKaprodiReview ? 'Review Kaprodi' : 'Review PRODI'}</h2>

          {showRejectForm ? (
            <div className="space-y-3">
              <textarea rows={3} value={rejectNotes} onChange={e => setRejectNotes(e.target.value)}
                placeholder="Catatan penolakan..."
                className="w-full border border-uph-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uph-red/30 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => { setShowRejectForm(null); setRejectNotes(''); }}
                  className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
                <button onClick={() => handleReview(showRejectForm, 'reject')}
                  disabled={submitting || !rejectNotes.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-uph-red rounded-lg hover:bg-uph-red/90 disabled:opacity-50">
                  {submitting && <Loader2 size={14} className="animate-spin" />} Tolak & Kembalikan
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setShowRejectForm(canKaprodiReview ? 'kaprodi' : 'prodi')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-uph-red rounded-lg hover:bg-uph-red/90 transition-colors">
                Tolak
              </button>
              <button onClick={() => handleReview(canKaprodiReview ? 'kaprodi' : 'prodi', 'approve')}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                {submitting && <Loader2 size={14} className="animate-spin" />}
                <CheckCircle size={14} /> Setujui
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
