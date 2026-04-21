"use client";

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import {
  ChevronDown, ChevronUp, Upload, Eye, Download,
  CheckCircle, Clock, AlertCircle, XCircle,
  ArrowLeft, X, Loader2, PenLine, Stamp, Lock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SyncIndicator } from '@/components/SyncIndicator';
import { SignaturePad } from '@/components/SignaturePad';
import type { SignaturePosition } from '@/components/PdfSignatureOverlay';

const PdfSignatureOverlay = dynamic(
  () => import('@/components/PdfSignatureOverlay').then(m => m.PdfSignatureOverlay),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Memuat viewer PDF…</div> }
);

const PdfAnnotationViewer = dynamic(
  () => import('@/components/PdfAnnotationViewer').then(m => m.PdfAnnotationViewer),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[500px] text-gray-400 text-sm">Memuat anotator PDF…</div> }
);

// ---------- constants ----------
const DOC_TYPES = [
  'RPS', 'SOAL_UTS', 'SOAL_UAS', 'LPP', 'EPP', 'BERITA_ACARA',
] as const;
type DocType = typeof DOC_TYPES[number];



const DOC_LABEL: Record<DocType, string> = {
  RPS: 'RPS',
  SOAL_UTS: 'Soal UTS',
  SOAL_UAS: 'Soal UAS',
  LPP: 'Laporan Pelaksanaan Pembelajaran',
  EPP: 'Evaluasi Pencapaian Program',
  BERITA_ACARA: 'Berita Acara Perwalian',
};

// ---------- types ----------
interface Doc {
  id: string | null;
  matkulId: string;
  dosenId: string;
  dosen?: { id: string; name: string };
  semesterId: string | null;
  type: DocType;
  status: string;
  isKoordinatorApproved: boolean;
  isProdiApproved?: boolean;
  fileUrl: string | null;
  fileName: string | null;
  annotatedPdfUrl: string | null;
  koordinatorNotes: string | null;
  kaprodiNotes: string | null;
  prodiNotes?: string | null;
  koordinatorId: string | null;
  koordinatorSignedPdfUrl: string | null;
  finalPdfUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // EPP fields
  eppPersentaseMateri?: number | null;
  eppPersentaseCpmk?: number | null;
  eppPersentaseKehadiran?: number | null;
  eppPersentaseNilaiB?: number | null;
  eppPersentaseKkmToB?: number | null;
}

interface SectionData {
  type: DocType;
  doc?: Doc | null;
  docs?: Doc[];
}

interface ApiResponse {
  role: 'dosen' | 'reviewer';
  sections: SectionData[];
}

interface MatkulClass {
  id: string;
  name: string;
  dosens: { id: string; name: string }[];
}

interface Props {
  matkul: { id: string; code: string; name: string; sks: number };
  dosens: { id: string; name: string; email: string }[];
  koordinators: { id: string; name: string }[];
  classes: MatkulClass[];
  initialDocs: Doc[];
  userRoles: string[];
  userId: string;
  userName: string;
  initialSemesterId: string | null;
  semesters: { id: string; nama: string; isActive: boolean; tahunAkademik: { tahun: string } }[];
}

// ---------- helpers ----------
const canUpload = (status: string) => status === 'UNSUBMITTED' || status === 'REVISION';

function StatusBadge({ status, isKoordinatorApproved, isProdiApproved }: { status: string; isKoordinatorApproved?: boolean; isProdiApproved?: boolean }) {
  if (status === 'APPROVED') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"><CheckCircle size={12} /> Disetujui</span>;
  if (status === 'REVISION') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700"><AlertCircle size={12} /> Revisi</span>;
  if (status === 'PENGECEKAN') {
    if (isProdiApproved) return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700"><Clock size={12} /> Menunggu Kaprodi</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700"><Clock size={12} /> Menunggu PRODI</span>;
  }
  if (status === 'SUBMITTED') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Clock size={12} /> Menunggu Koordinator</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"><XCircle size={12} /> Belum Upload</span>;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

const DISPLAY_DOC_TYPES = DOC_TYPES.filter(t => t !== 'BERITA_ACARA');

// ---------- main component ----------
export default function MatkulHubClient({ matkul, dosens, koordinators, classes, initialDocs, userRoles, userId, userName, initialSemesterId, semesters }: Props) {
  const router = useRouter();
  const [semesterId, setSemesterId] = useState(initialSemesterId);

  // SWR auto-refresh every 5s
  const swrKey = semesterId ? `/api/matkul/${matkul.id}/documents?semesterId=${encodeURIComponent(semesterId)}` : null;
  const { data, mutate, isValidating, error } = useSWR<ApiResponse>(
    swrKey,
    fetcher,
    { refreshInterval: 5000 }
  );

  // Flatten sections into docs array for lookups
  const docs: Doc[] = (() => {
    if (!data) return initialDocs;
    const flat: Doc[] = [];
    for (const section of data.sections) {
      if (data.role === 'reviewer') {
        for (const d of (section.docs ?? [])) flat.push({ ...d, type: section.type });
      } else {
        if (section.doc) flat.push({ ...section.doc, type: section.type });
      }
    }
    return flat;
  })();

  const isReviewer = userRoles.includes('kaprodi') || userRoles.includes('koordinator') || userRoles.includes('prodi');
  const isDosen = userRoles.includes('dosen');
  const showTabs = isReviewer && isDosen;
  const [activeTab, setActiveTab] = useState<'dosen' | 'reviewer'>(() =>
    isReviewer ? 'reviewer' : 'dosen'
  );
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // Upload state
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadType, setPendingUploadType] = useState<DocType | null>(null);

  // Review modal state
  const [reviewModal, setReviewModal] = useState<{ doc: Doc; role: 'koordinator' | 'kaprodi' | 'prodi' } | null>(null);
  const [signStep, setSignStep] = useState<'review' | 'sign'>('review');
  const [rejectNotes, setRejectNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Signature
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [sigPosition, setSigPosition] = useState<SignaturePosition>({ x: 60, y: 75, page: 1, width: 22 });
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [includeSig, setIncludeSig] = useState(false);
  const [eppFields, setEppFields] = useState({ eppPersentaseMateri: '', eppPersentaseCpmk: '', eppPersentaseKehadiran: '', eppPersentaseNilaiB: '', eppPersentaseKkmToB: '' });
  const [savingEpp, setSavingEpp] = useState(false);
  const [eppSaved, setEppSaved] = useState(false);
  const eppDoc = docs.find(d => d.type === 'EPP' && d.dosenId === userId) ?? null;
  // Sync EPP inputs from saved doc data
  useEffect(() => {
    if (!eppDoc) return;
    const synced = {
      eppPersentaseMateri: eppDoc.eppPersentaseMateri != null ? String(eppDoc.eppPersentaseMateri) : '',
      eppPersentaseCpmk: eppDoc.eppPersentaseCpmk != null ? String(eppDoc.eppPersentaseCpmk) : '',
      eppPersentaseKehadiran: eppDoc.eppPersentaseKehadiran != null ? String(eppDoc.eppPersentaseKehadiran) : '',
      eppPersentaseNilaiB: eppDoc.eppPersentaseNilaiB != null ? String(eppDoc.eppPersentaseNilaiB) : '',
      eppPersentaseKkmToB: eppDoc.eppPersentaseKkmToB != null ? String(eppDoc.eppPersentaseKkmToB) : '',
    };
    setEppFields(synced);
    setEppSaved(Object.values(synced).every(v => v !== ''));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eppDoc?.id, eppDoc?.eppPersentaseMateri, eppDoc?.eppPersentaseCpmk, eppDoc?.eppPersentaseKehadiran, eppDoc?.eppPersentaseNilaiB, eppDoc?.eppPersentaseKkmToB]);

  useEffect(() => {
    fetch('/api/users/me/signature')
      .then(r => r.json())
      .then((d: { savedSignature: string | null }) => setSavedSignature(d.savedSignature ?? null))
      .catch(() => {});
  }, []);

  const toggleSection = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ---------- data helpers ----------
  const getDoc = (type: DocType, dosenId?: string): Doc | null =>
    docs.find(d => d.type === type && (dosenId ? d.dosenId === dosenId : d.dosenId === userId)) ?? null;

  // ---------- upload ----------
  const handleUploadClick = (type: DocType) => {
    setPendingUploadType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = pendingUploadType;
    if (!file || !type) return;
    e.target.value = '';
    setUploading(type);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    fd.append('semesterId', semesterId ?? '');

    await fetch(`/api/matkul/${matkul.id}/documents/upload`, { method: 'POST', body: fd });
    setUploading(null);
    setPendingUploadType(null);
    mutate();
  };

  // ---------- review ----------
  const openReview = (doc: Doc) => {
    // Universal workflow: Koor → Prodi → Kaprodi for all doc types
    let role: 'koordinator' | 'prodi' | 'kaprodi';
    if (doc.isProdiApproved && userRoles.includes('kaprodi')) {
      role = 'kaprodi';
    } else if (doc.isKoordinatorApproved && userRoles.includes('prodi')) {
      role = 'prodi';
    } else {
      role = 'koordinator';
    }
    setReviewModal({ doc, role });
    setSignStep('review');
    setRejectNotes('');
    setSignatureDataUrl(null);
    setSigPosition({ x: 60, y: 75, page: 1, width: 22 });
    setIncludeSig(false);
  };

  const closeModal = () => {
    setReviewModal(null);
    setSignatureDataUrl(null);
  };

  const handleReject = async () => {
    if (!reviewModal || !rejectNotes.trim()) return;
    setSubmitting(true);
    await fetch(`/api/documents/${reviewModal.doc.id}/annotations/flatten`, { method: 'POST' });
    const res = await fetch(`/api/documents/${reviewModal.doc.id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer: reviewModal.role, action: 'reject', notes: rejectNotes }),
    });
    setSubmitting(false);
    if (res.ok) { closeModal(); mutate(); }
  };

  const handleSaveSignature = async (dataUrl: string) => {
    await fetch('/api/users/me/signature', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ savedSignature: dataUrl }),
    });
    setSavedSignature(dataUrl);
  };

  const handleSaveEpp = async (type: DocType) => {
    const allFilled = Object.values(eppFields).every(v => v !== '');
    if (!allFilled) {
      alert('Harap isi semua data EPP terlebih dahulu sebelum menyimpan.');
      return;
    }
    setSavingEpp(true);
    const fd = new FormData();
    fd.append('type', type);
    fd.append('semesterId', semesterId ?? '');
    Object.entries(eppFields).forEach(([k, v]) => { fd.append(k, v); });
    const res = await fetch(`/api/matkul/${matkul.id}/documents/upload`, { method: 'POST', body: fd });
    setSavingEpp(false);
    if (res.ok) { setEppSaved(true); mutate(); }
  };

  const handleStampAndApprove = async () => {
    if (!reviewModal) return;
    if (includeSig && !signatureDataUrl) {
      alert('Harap buat tanda tangan terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    let res: Response;
    if (!includeSig) {
      res = await fetch(`/api/documents/${reviewModal.doc.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer: reviewModal.role, action: 'approve' }),
      });
    } else {
      res = await fetch(`/api/documents/${reviewModal.doc.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer: reviewModal.role,
          sigData: signatureDataUrl,
          sigX: sigPosition.x,
          sigY: sigPosition.y,
          sigPage: sigPosition.page,
          sigWidth: sigPosition.width,
          reviewerName: userName,
        }),
      });
    }
    setSubmitting(false);
    if (res.ok) { closeModal(); mutate(); }
    else {
      const err = await res.json().catch(() => ({}));
      alert(`Gagal: ${err.error ?? 'Terjadi kesalahan.'}`);
    }
  };

  // ---------- reviewer eligibility ----------
  const reviewerCanReview = (doc: Doc): boolean => {
    if (!doc.id) return false;
    // Kaprodi: after Prodi approves
    if (userRoles.includes('kaprodi') && doc.isProdiApproved && doc.status === 'PENGECEKAN') return true;
    // Prodi: after Koordinator approves, before Prodi approves
    if (userRoles.includes('prodi') && doc.isKoordinatorApproved && !doc.isProdiApproved && doc.status === 'PENGECEKAN') return true;
    // Koordinator: doc submitted, not yet koordinator-approved
    if (userRoles.includes('koordinator') && !doc.isKoordinatorApproved && doc.status === 'SUBMITTED') return true;
    return false;
  };

  // ---------- Dosen view ----------
  const renderDosenView = () => (
    <div className="space-y-3">
      {DISPLAY_DOC_TYPES.map(type => {
        const doc = getDoc(type);
        const isOpen = openSections.has(type);
        const isUploading = uploading === type;
        const status = doc?.status ?? 'UNSUBMITTED';
        const uploadAllowed = canUpload(status);
        return (
          <div key={type} className="bg-white border border-uph-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection(type)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-800">{DOC_LABEL[type]}</span>
                <StatusBadge status={status} isKoordinatorApproved={doc?.isKoordinatorApproved} isProdiApproved={doc?.isProdiApproved} />
              </div>
              {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
                {/* APPROVED */}
                {status === 'APPROVED' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700 font-semibold">Dokumen telah disetujui.</span>
                    <div className="flex gap-2">
                      {doc?.finalPdfUrl && (
                        <a href={doc.finalPdfUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-semibold text-uph-blue border border-uph-blue px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                          <Download size={14} /> PDF Final (Bertanda Tangan)
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* REVISION */}
                {status === 'REVISION' && (
                  <div className="space-y-2">
                    {doc?.koordinatorNotes && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-red-600 mb-1">Catatan Koordinator:</p>
                        <p className="text-sm text-red-700">{doc.koordinatorNotes}</p>
                      </div>
                    )}
                    {doc?.kaprodiNotes && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-red-600 mb-1">Catatan Kaprodi:</p>
                        <p className="text-sm text-red-700">{doc.kaprodiNotes}</p>
                      </div>
                    )}
                    {doc?.prodiNotes && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-red-600 mb-1">Catatan PRODI:</p>
                        <p className="text-sm text-red-700">{doc.prodiNotes}</p>
                      </div>
                    )}
                    {doc?.annotatedPdfUrl && (
                      <a href={doc.annotatedPdfUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm font-semibold text-uph-blue hover:underline">
                        <Eye size={14} /> Lihat Anotasi PDF
                      </a>
                    )}
                  </div>
                )}

                {/* SUBMITTED / PENGECEKAN */}
                {(status === 'SUBMITTED' || status === 'PENGECEKAN') && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <Lock size={14} className="text-amber-500 flex-shrink-0" />
                    Dokumen sedang dalam proses review - tidak bisa diupload ulang.
                  </div>
                )}

                {/* UNSUBMITTED */}
                {status === 'UNSUBMITTED' && (
                  <p className="text-sm text-gray-400">Belum ada dokumen yang diunggah.</p>
                )}

                {/* EPP additional inputs */}
                {type === 'EPP' && uploadAllowed && (
                  <div className="border border-uph-border rounded-xl p-4 space-y-3 bg-blue-50/30">
                    <p className="text-xs font-bold text-uph-blue uppercase tracking-wide">Data EPP</p>
                    {[
                      { key: 'eppPersentaseMateri', label: 'Persentase kesesuaian materi dari perencanaan (RPS)' },
                      { key: 'eppPersentaseCpmk', label: 'Persentase kesesuaian CPMK dengan Sub CPMK' },
                      { key: 'eppPersentaseKehadiran', label: 'Persentase rata-rata kehadiran mahasiswa dalam setiap pertemuan' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{label} (%)</label>
                        <input
                          type="text" inputMode="decimal" value={eppFields[key as keyof typeof eppFields]}
                          onKeyDown={e => { if (['e','E','+','-',' '].includes(e.key) || (e.key.length === 1 && !/[\d.]/.test(e.key))) e.preventDefault(); }}
                          onChange={e => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) { const n = parseFloat(v); if (v === '' || (n >= 0 && n <= 100)) { setEppFields(f => ({ ...f, [key]: v })); setEppSaved(false); } } }}
                          className="w-full border border-uph-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-uph-blue/30"
                          placeholder="0–100" />
                      </div>
                    ))}
                    <p className="text-xs font-bold text-gray-600 mt-2">Tingkat pemahaman mahasiswa terhadap materi yang diberikan</p>
                    {[
                      { key: 'eppPersentaseNilaiB', label: 'Persentase jumlah mahasiswa yang mendapat nilai minimal ≥ B' },
                      { key: 'eppPersentaseKkmToB', label: 'Persentase jumlah mahasiswa yang mendapat KKM ≤ Nilai < B' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">{label} (%)</label>
                        <input
                          type="text" inputMode="decimal" value={eppFields[key as keyof typeof eppFields]}
                          onKeyDown={e => { if (['e','E','+','-',' '].includes(e.key) || (e.key.length === 1 && !/[\d.]/.test(e.key))) e.preventDefault(); }}
                          onChange={e => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) { const n = parseFloat(v); if (v === '' || (n >= 0 && n <= 100)) { setEppFields(f => ({ ...f, [key]: v })); setEppSaved(false); } } }}
                          className="w-full border border-uph-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-uph-blue/30"
                          placeholder="0–100" />
                      </div>
                    ))}
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleSaveEpp(type)} disabled={savingEpp}
                        className="flex items-center gap-2 px-3 py-1.5 bg-uph-blue text-white rounded-lg text-xs font-bold hover:bg-uph-blue/90 disabled:opacity-50 transition-colors">
                        {savingEpp ? <Loader2 size={12} className="animate-spin" /> : null}
                        Simpan Data EPP
                      </button>
                      {eppSaved && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                          <CheckCircle size={13} /> Data tersimpan
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* EPP read-only display when locked/approved */}
                {type === 'EPP' && !uploadAllowed && doc && (doc.eppPersentaseMateri != null || doc.eppPersentaseCpmk != null) && (
                  <div className="border border-gray-200 rounded-xl p-3 space-y-1.5 bg-gray-50/50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Data EPP</p>
                    {[
                      { key: 'eppPersentaseMateri', label: 'Kesesuaian materi (RPS)' },
                      { key: 'eppPersentaseCpmk', label: 'Kesesuaian CPMK' },
                      { key: 'eppPersentaseKehadiran', label: 'Kehadiran mahasiswa' },
                      { key: 'eppPersentaseNilaiB', label: 'Nilai ≥ B' },
                      { key: 'eppPersentaseKkmToB', label: 'KKM ≤ Nilai < B' },
                    ].map(({ key, label }) => {
                      const val = doc[key as keyof Doc];
                      if (val == null) return null;
                      return <div key={key} className="flex justify-between text-xs"><span className="text-gray-500">{label}</span><span className="font-bold text-gray-700">{String(val)}%</span></div>;
                    })}
                  </div>
                )}

                {/* Upload button - only when allowed */}
                {uploadAllowed ? (
                  <button
                    onClick={() => handleUploadClick(type)}
                    disabled={isUploading || (type === 'EPP' && !eppSaved)}
                    title={type === 'EPP' && !eppSaved ? 'Simpan Data EPP terlebih dahulu' : undefined}
                    className="flex items-center gap-2 px-4 py-2 bg-uph-blue text-white rounded-lg text-sm font-semibold hover:bg-uph-blue/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {status === 'UNSUBMITTED' ? 'Upload Dokumen' : 'Upload Ulang'}
                  </button>
                ) : status !== 'APPROVED' && (
                  <button disabled className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 rounded-lg text-sm font-semibold cursor-not-allowed">
                    <Lock size={14} /> Upload Terkunci
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ---------- Reviewer view ----------
  const renderReviewerView = () => {
    return (
    <div className="space-y-3">
      {DISPLAY_DOC_TYPES.map(type => {
        const isOpen = openSections.has(`rev-${type}`);
        const typeDocs: Doc[] = dosens.map(dosen => {
          const doc = getDoc(type, dosen.id);
          return doc ?? ({
            id: null, matkulId: matkul.id, dosenId: dosen.id,
            dosen: { id: dosen.id, name: dosen.name },
            semesterId: semesterId ?? null, type,
            status: 'UNSUBMITTED', isKoordinatorApproved: false, isProdiApproved: false,
            fileUrl: null, fileName: null, annotatedPdfUrl: null,
            koordinatorNotes: null, kaprodiNotes: null, prodiNotes: null, koordinatorId: null,
            koordinatorSignedPdfUrl: null, finalPdfUrl: null,
            createdAt: null, updatedAt: null,
          } as Doc);
        });

        const pendingCount = typeDocs.filter(d => reviewerCanReview(d)).length;

        return (
          <div key={type} className="bg-white border border-uph-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection(`rev-${type}`)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-800">{DOC_LABEL[type]}</span>
                {pendingCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-uph-red text-white">
                    {pendingCount} perlu review
                  </span>
                )}
              </div>
              {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-100">
                {typeDocs.map(doc => {
                  const dosenName = doc.dosen?.name ?? dosens.find(d => d.id === doc.dosenId)?.name ?? doc.dosenId;
                  // Which notes are relevant for this reviewer
                  const relevantNote = userRoles.includes('kaprodi')
                    ? (doc.kaprodiNotes ?? doc.prodiNotes ?? doc.koordinatorNotes)
                    : userRoles.includes('prodi')
                      ? (doc.prodiNotes ?? doc.koordinatorNotes)
                      : doc.koordinatorNotes;
                  const rejectedBy = doc.prodiNotes ? 'PRODI' : doc.kaprodiNotes ? 'Kaprodi' : doc.koordinatorNotes ? 'Koordinator' : null;
                  const showRevisionDetail = doc.status === 'REVISION' && (relevantNote || doc.annotatedPdfUrl);

                  return (
                    <div key={doc.dosenId} className={`px-5 py-3 ${showRevisionDetail ? 'bg-red-50/40' : 'hover:bg-gray-50'} transition-colors`}>
                      {/* Main row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="font-medium text-gray-800 truncate">{dosenName}</span>
                          <StatusBadge status={doc.status} isKoordinatorApproved={doc.isKoordinatorApproved} isProdiApproved={doc.isProdiApproved} />
                        </div>
                        <div className="flex-shrink-0">
                          {reviewerCanReview(doc) ? (
                            <button
                              onClick={() => openReview(doc)}
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-uph-blue text-white rounded-lg hover:bg-uph-blue/90 transition-colors"
                            >
                              <PenLine size={12} /> Review & Tanda Tangan
                            </button>
                          ) : doc.id && doc.status !== 'UNSUBMITTED' ? (
                            <a
                              href={doc.finalPdfUrl ?? doc.koordinatorSignedPdfUrl ?? doc.fileUrl ?? '#'}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 text-gray-500 hover:text-uph-blue transition-colors"
                            >
                              <Eye size={12} /> Lihat
                            </a>
                          ) : null}
                        </div>
                      </div>

                      {/* EPP data inline for reviewers */}
                      {type === 'EPP' && doc.id && (doc.eppPersentaseMateri != null || doc.eppPersentaseCpmk != null) && (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
                          {[
                            { key: 'eppPersentaseMateri' as keyof Doc, label: 'Materi' },
                            { key: 'eppPersentaseCpmk' as keyof Doc, label: 'CPMK' },
                            { key: 'eppPersentaseKehadiran' as keyof Doc, label: 'Kehadiran' },
                            { key: 'eppPersentaseNilaiB' as keyof Doc, label: '≥B' },
                            { key: 'eppPersentaseKkmToB' as keyof Doc, label: 'KKM→B' },
                          ].map(({ key, label }) => {
                            const val = doc[key];
                            if (val == null) return null;
                            return <span key={key} className="text-xs text-gray-500">{label}: <span className="font-bold text-gray-700">{String(val)}%</span></span>;
                          })}
                        </div>
                      )}

                      {/* Revision detail - notes + annotated PDF */}
                      {showRevisionDetail && (
                        <div className="mt-2 ml-0 space-y-1.5">
                          {relevantNote && (
                            <div className="bg-white border border-red-200 rounded-lg px-3 py-2">
                              <p className="text-xs font-bold text-red-500 mb-0.5">
                                Ditolak oleh {rejectedBy}:
                              </p>
                              <p className="text-xs text-red-700 italic">&ldquo;{relevantNote}&rdquo;</p>
                            </div>
                          )}
                          {doc.annotatedPdfUrl && (
                            <a
                              href={doc.annotatedPdfUrl}
                              target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-uph-blue hover:underline"
                            >
                              <Eye size={12} /> Lihat PDF Beranotasi
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
    );
  };

  // ---------- Review modal (2-step: annotate/reject → sign/approve) ----------
  const renderReviewModal = () => {
    if (!reviewModal) return null;
    const { doc, role } = reviewModal;

    // Stage-2 reviewers (kaprodi, prodi) review koordinator-signed PDF; koordinator reviews original
    const reviewPdfUrl = (role === 'kaprodi' || role === 'prodi')
      ? (doc.koordinatorSignedPdfUrl ?? doc.fileUrl)
      : doc.fileUrl;
    const isPdf = reviewPdfUrl?.toLowerCase().endsWith('.pdf') ?? false;
    const dosenName = doc.dosen?.name ?? dosens.find(d => d.id === doc.dosenId)?.name ?? doc.dosenId;

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4">
        <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl my-4 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div>
              <h2 className="font-playfair text-lg font-bold text-uph-blue">
                {signStep === 'review' ? 'Tinjau Dokumen' : 'Tanda Tangan & Setujui'}
              </h2>
              <p className="text-sm text-gray-500">{DOC_LABEL[doc.type]} · {dosenName}</p>
            </div>
            <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Step tabs */}
          <div className="flex border-b border-gray-100">
            {(['review', 'sign'] as const).map((step, i) => (
              <div key={step} className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-colors ${signStep === step ? 'border-uph-blue text-uph-blue bg-blue-50/30' : 'border-transparent text-gray-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${signStep === step ? 'bg-uph-blue text-white' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
                {step === 'review' ? 'Tinjau & Anotasi' : 'Tanda Tangan Final'}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {/* ── STEP 1: Annotate + reject ── */}
            {signStep === 'review' && (
              <div className="space-y-5">
                {/* File info bar */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-uph-blue text-sm">{doc.fileName ?? 'File'}</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      {(role === 'kaprodi' || role === 'prodi') && doc.koordinatorSignedPdfUrl
                        ? '✓ PDF sudah ditandatangani Koordinator'
                        : 'Dokumen original dari Dosen'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                        className="text-xs font-bold px-3 py-1.5 border border-uph-blue text-uph-blue rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1">
                        <Download size={12} /> Original
                      </a>
                    )}
                    {role === 'kaprodi' && doc.koordinatorSignedPdfUrl && (
                      <a href={doc.koordinatorSignedPdfUrl} target="_blank" rel="noreferrer"
                        className="text-xs font-bold px-3 py-1.5 bg-uph-blue text-white rounded-lg hover:bg-uph-blue/90 transition-colors flex items-center gap-1">
                        <Download size={12} /> Ditandatangani Koordinator
                      </a>
                    )}
                  </div>
                </div>

                {/* EPP data read-only for reviewers */}
                {doc.type === 'EPP' && (doc.eppPersentaseMateri != null || doc.eppPersentaseCpmk != null) && (
                  <div className="border border-blue-100 rounded-xl p-3 bg-blue-50/30 space-y-1.5">
                    <p className="text-xs font-bold text-uph-blue uppercase tracking-wide mb-2">Data EPP</p>
                    {[
                      { key: 'eppPersentaseMateri', label: 'Kesesuaian materi (RPS)' },
                      { key: 'eppPersentaseCpmk', label: 'Kesesuaian CPMK' },
                      { key: 'eppPersentaseKehadiran', label: 'Kehadiran mahasiswa' },
                      { key: 'eppPersentaseNilaiB', label: 'Nilai ≥ B' },
                      { key: 'eppPersentaseKkmToB', label: 'KKM ≤ Nilai < B' },
                    ].map(({ key, label }) => {
                      const val = doc[key as keyof typeof doc];
                      if (val == null) return null;
                      return <div key={key} className="flex justify-between text-xs"><span className="text-gray-500">{label}</span><span className="font-bold text-gray-700">{String(val)}%</span></div>;
                    })}
                  </div>
                )}

                {/* Annotation viewer */}
                {isPdf && reviewPdfUrl && doc.id && (
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-2">
                      Anotasi PDF <span className="text-xs font-normal text-gray-400">(opsional - tambahkan catatan langsung pada PDF sebelum menolak)</span>
                    </p>
                    <PdfAnnotationViewer
                      pdfUrl={reviewPdfUrl}
                      apiBase={`/api/documents/${doc.id}`}
                      reviewerRole={role}
                    />
                  </div>
                )}

                {/* Rejection notes */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Catatan Revisi <span className="text-red-500 font-normal text-xs">(wajib diisi jika menolak)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectNotes}
                    onChange={e => setRejectNotes(e.target.value)}
                    placeholder="Tuliskan alasan penolakan dan revisi yang diperlukan..."
                    className="w-full border border-uph-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uph-red/30 resize-none"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: Sign + approve ── */}
            {signStep === 'sign' && (
              <div className="space-y-5">
                {/* Signature toggle */}
                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeSig}
                    onChange={e => setIncludeSig(e.target.checked)}
                    className="w-4 h-4 accent-uph-blue"
                  />
                  <span className="text-sm font-semibold text-gray-700">Sertakan Tanda Tangan</span>
                  <span className="text-xs text-gray-400 ml-auto">{includeSig ? 'Tanda tangan akan distempel ke PDF' : 'Setujui tanpa tanda tangan'}</span>
                </label>

                {includeSig && (
                  <>
                    {(role === 'kaprodi' || role === 'prodi') && doc.koordinatorSignedPdfUrl && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium flex items-center gap-2">
                        <CheckCircle size={16} /> Menandatangani PDF yang sudah ditandatangani Koordinator.
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <PenLine size={16} className="text-uph-blue" />
                          {role === 'koordinator' ? 'Tanda Tangan Koordinator' : role === 'prodi' ? 'Tanda Tangan PRODI' : 'Tanda Tangan Kaprodi'}
                        </h3>
                        <SignaturePad
                          onSignatureChange={setSignatureDataUrl}
                          savedSignature={savedSignature}
                          onSaveSignature={handleSaveSignature}
                        />
                        {signatureDataUrl && (
                          <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
                            <CheckCircle size={12} /> Tanda tangan siap. Nama &amp; waktu akan ditambahkan otomatis.
                          </p>
                        )}
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-amber-800 mb-2">Petunjuk</h4>
                        <ol className="text-xs text-amber-700 space-y-1.5 list-decimal list-inside">
                          <li>Gambar atau upload tanda tangan.</li>
                          <li>Seret ke posisi di PDF.</li>
                          <li>Resize dengan handle sudut kanan-bawah jika perlu.</li>
                          <li>Klik <strong>Stamp & Setujui</strong> untuk menyelesaikan.</li>
                        </ol>
                      </div>
                    </div>

                    {reviewPdfUrl && isPdf ? (
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <Stamp size={16} className="text-uph-blue" /> Posisikan Tanda Tangan
                        </h3>
                        <PdfSignatureOverlay
                          pdfUrl={reviewPdfUrl}
                          signatureDataUrl={signatureDataUrl}
                          position={sigPosition}
                          onPositionChange={setSigPosition}
                          userName={userName}
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                        <p className="font-bold mb-1">File bukan PDF - preview tidak tersedia</p>
                        <p className="text-xs">Minta Dosen mengupload ulang dalam format PDF.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
            <div className="flex gap-2">
              {signStep === 'sign' && (
                <button onClick={() => setSignStep('review')}
                  className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-colors">
                  ← Kembali
                </button>
              )}
              <button onClick={closeModal}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-lg transition-colors">
                Batal
              </button>
            </div>

            <div className="flex gap-3">
              {signStep === 'review' && (
                <>
                  <button
                    onClick={handleReject}
                    disabled={submitting || !rejectNotes.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-uph-red text-white rounded-lg text-sm font-bold hover:bg-uph-red/90 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Tolak & Kembalikan
                  </button>
                  <button
                    onClick={() => setSignStep('sign')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-uph-blue text-white rounded-lg text-sm font-bold hover:bg-uph-blue/90 transition-colors"
                  >
                    <PenLine size={14} /> Lanjut: Tanda Tangan →
                  </button>
                </>
              )}

              {signStep === 'sign' && (
                <button
                  onClick={handleStampAndApprove}
                  disabled={submitting || (includeSig && (!signatureDataUrl || !isPdf))}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Stamp size={14} />}
                  {includeSig ? 'Stamp & Setujui' : 'Setujui Tanpa Tanda Tangan'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ---------- main render ----------
  return (
    <>
      <div>
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-uph-blue mb-3 transition-colors"
          >
            <ArrowLeft size={14} /> Kembali
          </button>
          <h1 className="font-playfair text-2xl font-bold text-uph-blue">{matkul.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{matkul.code} · {matkul.sks} SKS</p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Koordinator */}
          <div className="bg-white border border-uph-border rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Koordinator</p>
            {koordinators.length === 0
              ? <p className="text-sm text-gray-400 italic">Belum ditetapkan</p>
              : koordinators.map(k => (
                <p key={k.id} className="text-sm font-semibold text-gray-800">{k.name}</p>
              ))
            }
          </div>

          {/* Dosen Pengampu */}
          <div className="bg-white border border-uph-border rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Dosen Pengampu</p>
            {dosens.length === 0
              ? <p className="text-sm text-gray-400 italic">Belum ada dosen</p>
              : <p className="text-sm font-semibold text-gray-800">{dosens.length} Dosen</p>
            }
          </div>

          {/* Kelas */}
          <div className="bg-white border border-uph-border rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Kelas</p>
            {classes.length === 0
              ? <p className="text-sm text-gray-400 italic">Belum ada kelas</p>
              : <div className="flex flex-wrap gap-1.5">
                  {classes.map(c => (
                    <span key={c.id} className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-uph-blue border border-blue-100">
                      {c.name}
                    </span>
                  ))}
                </div>
            }
          </div>
        </div>

        {/* Kelas detail (only show if classes exist) */}
        {classes.length > 0 && (
          <div className="bg-white border border-uph-border rounded-xl px-4 py-3 mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Detail Kelas</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {classes.map(c => (
                <div key={c.id} className="border border-gray-100 rounded-lg px-3 py-2 bg-gray-50">
                  <p className="text-sm font-bold text-uph-blue mb-1">{c.name}</p>
                  {c.dosens.length === 0
                    ? <p className="text-xs text-gray-400 italic">Belum ada dosen</p>
                    : c.dosens.map(d => (
                        <p key={d.id} className="text-xs text-gray-600">{d.name}</p>
                      ))
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs (dual-role only) */}
        {showTabs && (
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab('dosen')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'dosen' ? 'bg-white shadow text-uph-blue' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Dokumen Saya
            </button>
            <button
              onClick={() => setActiveTab('reviewer')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'reviewer' ? 'bg-white shadow text-uph-blue' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Review Dosen
            </button>
          </div>
        )}

        {/* Content */}
        {(!isReviewer || activeTab === 'dosen') && renderDosenView()}
        {(isReviewer && !isDosen) && renderReviewerView()}
        {(isReviewer && isDosen && activeTab === 'reviewer') && renderReviewerView()}

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Review modal */}
      {renderReviewModal()}

      {/* Sync indicator */}
      <SyncIndicator isValidating={isValidating} error={error} />
    </>
  );
}
