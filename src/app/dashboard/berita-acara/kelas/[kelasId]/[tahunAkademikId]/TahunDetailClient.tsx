"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertCircle, Lock, Unlock, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Bap {
  id: string;
  isUnlocked: boolean;
  status: string;
  isProdiApproved: boolean;
  lembarKehadiranUrl: string | null;
  absensiUrl: string | null;
  beritaAcaraUrl: string | null;
  semester: { id: string; nama: string; isActive: boolean; tahunAkademik: { id: string; tahun: string } };
  createdAt: string;
  updatedAt: string;
  finalApprovedAt: string | null;
}

interface Props {
  kelas: { id: string; name: string; dosenPa: { id: string; name: string } };
  tahunAkademik: { id: string; tahun: string; isActive: boolean };
  baps: Bap[];
  isKaprodi: boolean;
  isProdi: boolean;
  isDosenPa: boolean;
}

const SEMESTER_ORDER = ['Ganjil', 'Genap', 'Akselerasi'];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

// 3-segment file progress bar
function FileBar({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map(i => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < count ? 'bg-uph-blue' : 'bg-gray-200'}`} />
      ))}
    </div>
  );
}

function cardBorderClass(status: string, isUnlocked: boolean) {
  if (!isUnlocked) return 'border-gray-200';
  if (status === 'APPROVED') return 'border-green-300';
  if (status === 'REVISION') return 'border-red-300';
  if (status === 'SUBMITTED') return 'border-amber-400';
  return 'border-gray-200';
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'APPROVED') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
      <CheckCircle size={11} /> Disetujui
    </span>
  );
  if (status === 'REVISION') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
      <AlertCircle size={11} /> Revisi
    </span>
  );
  if (status === 'SUBMITTED') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      <Clock size={11} /> Menunggu Review
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      <FileText size={11} /> Belum Lengkap
    </span>
  );
}

export default function TahunDetailClient({ kelas, tahunAkademik, baps: initialBaps, isKaprodi, isProdi, isDosenPa }: Props) {
  const router = useRouter();
  const [baps, setBaps] = useState(initialBaps);
  const [confirmUnlock, setConfirmUnlock] = useState<Bap | null>(null);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(id);
  }, [router]);

  const sorted = [...baps].sort((a, b) =>
    SEMESTER_ORDER.indexOf(a.semester.nama) - SEMESTER_ORDER.indexOf(b.semester.nama)
  );

  const handleUnlock = async () => {
    if (!confirmUnlock) return;
    setUnlocking(true);
    const res = await fetch(`/api/bap/${confirmUnlock.id}/unlock`, { method: 'PATCH' });
    setUnlocking(false);
    if (res.ok) {
      setBaps(prev => prev.map(b => b.id === confirmUnlock.id ? { ...b, isUnlocked: true } : b));
      setConfirmUnlock(null);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? 'Gagal membuka akses');
    }
  };

  const pendingReviewCount = baps.filter(b => b.status === 'SUBMITTED').length;

  return (
    <div>
      <button onClick={() => router.push(`/dashboard/berita-acara/kelas/${kelas.id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-uph-blue mb-5 transition-colors">
        <ArrowLeft size={14} /> Kembali ke Kelas
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-uph-blue">
            Kelas {kelas.name} — {tahunAkademik.tahun}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Dosen PA: <strong className="text-gray-700">{kelas.dosenPa.name}</strong></p>
        </div>
        {isKaprodi && pendingReviewCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {pendingReviewCount} perlu review
          </span>
        )}
      </div>

      <div className="mb-6" />

      {/* Confirm unlock modal */}
      {confirmUnlock && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-uph-blue/10 flex items-center justify-center">
                <Unlock size={22} className="text-uph-blue" />
              </div>
              <div>
                <h2 className="font-playfair text-lg font-bold text-uph-blue">Buka Akses Upload</h2>
                <p className="text-xs text-gray-500">Semester {confirmUnlock.semester.nama}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Dosen PA <strong>{kelas.dosenPa.name}</strong> akan mendapat notifikasi dan dapat mengupload dokumen BAP untuk semester <strong>{confirmUnlock.semester.nama}</strong>.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2">
              <AlertCircle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirmUnlock(null)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleUnlock} disabled={unlocking}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-uph-blue rounded-xl hover:bg-uph-blue/90 disabled:opacity-50">
                {unlocking ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}
                Buka Akses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BAP cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sorted.map(bap => {
          const fileCount = [bap.lembarKehadiranUrl, bap.absensiUrl, bap.beritaAcaraUrl].filter(Boolean).length;
          const adminLocked = !bap.semester.isActive;
          const kaprodiLocked = !bap.isUnlocked;
          const canAccess = isKaprodi || isProdi || isDosenPa;
          const needsReview = bap.status === 'SUBMITTED';

          // ── Admin locked ────────────────────────────────────
          if (adminLocked) {
            return (
              <div key={bap.id} className="bg-white border border-amber-200 rounded-2xl p-5 opacity-60 cursor-not-allowed select-none">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Lock size={20} className="text-amber-400" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                    <Clock size={11} /> Menunggu Admin
                  </span>
                </div>
                <p className="font-bold text-gray-600 text-base mb-1">{bap.semester.nama}</p>
                <p className="text-xs text-amber-600">Semester belum diaktifkan admin</p>
              </div>
            );
          }

          // ── Kaprodi locked ──────────────────────────────────
          if (kaprodiLocked) {
            return (
              <div key={bap.id} className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Lock size={20} className="text-gray-400" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                    <Lock size={11} /> Terkunci
                  </span>
                </div>
                <p className="font-bold text-gray-600 text-base mb-1">{bap.semester.nama}</p>
                <p className="text-xs text-gray-400 mb-4">Belum dibuka untuk Dosen PA</p>
                <div className="mt-auto">
                  {isKaprodi ? (
                    <button
                      onClick={() => setConfirmUnlock(bap)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-uph-blue border-2 border-uph-blue rounded-xl hover:bg-blue-50 transition-colors">
                      <Unlock size={15} /> Buka Akses
                    </button>
                  ) : (
                    <div className="w-full py-2.5 text-xs text-center text-gray-400">
                      Menunggu Kaprodi membuka akses
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // ── Active card ─────────────────────────────────────
          const borderClass = cardBorderClass(bap.status, true);
          const card = (
            <div className={`bg-white border-2 rounded-2xl p-5 flex flex-col h-full transition-all ${borderClass} ${canAccess ? 'hover:shadow-md cursor-pointer' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  bap.status === 'APPROVED' ? 'bg-green-100' :
                  bap.status === 'REVISION' ? 'bg-red-100' :
                  bap.status === 'SUBMITTED' ? 'bg-amber-100' :
                  'bg-uph-blue/10'
                }`}>
                  {bap.status === 'APPROVED'
                    ? <CheckCircle size={22} className="text-green-600" />
                    : bap.status === 'REVISION'
                      ? <AlertCircle size={22} className="text-red-500" />
                      : <FileText size={22} className="text-uph-blue" />}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Pulsing dot for SUBMITTED */}
                  {needsReview && isKaprodi && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                  <StatusBadge status={bap.status} />
                </div>
              </div>

              <p className="font-bold text-gray-800 text-base mb-1">{bap.semester.nama}</p>

              {/* File progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">{fileCount}/3 dokumen</span>
                  {bap.status === 'SUBMITTED' && (
                    <span className="text-xs text-amber-600 font-medium">{timeAgo(bap.updatedAt)}</span>
                  )}
                  {bap.status === 'APPROVED' && bap.finalApprovedAt && (
                    <span className="text-xs text-green-600 font-medium">{timeAgo(bap.finalApprovedAt)}</span>
                  )}
                </div>
                <FileBar count={fileCount} />
              </div>

              {/* CTA row */}
              {canAccess && (
                <div className="mt-auto flex items-center justify-end">
                  <span className={`text-xs font-bold flex items-center gap-1 ${
                    needsReview && isKaprodi ? 'text-amber-600' : 'text-uph-blue'
                  }`}>
                    {needsReview && isKaprodi ? 'Review sekarang' : 'Buka detail'}
                    <ChevronRight size={13} />
                  </span>
                </div>
              )}
            </div>
          );

          return canAccess ? (
            <Link key={bap.id} href={`/dashboard/berita-acara/${bap.id}`} className="block">
              {card}
            </Link>
          ) : (
            <div key={bap.id}>{card}</div>
          );
        })}

        {sorted.length === 0 && (
          <div className="col-span-3 bg-white rounded-2xl border border-uph-border p-12 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-semibold">Belum ada semester untuk tahun ini</p>
          </div>
        )}
      </div>
    </div>
  );
}
