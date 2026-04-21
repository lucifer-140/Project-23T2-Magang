"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, CheckCircle, Clock, AlertCircle, XCircle, Lock, Unlock, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Bap {
  id: string;
  isUnlocked: boolean;
  status: string;
  isProdiApproved: boolean;
  lembarKehadiranUrl: string | null;
  absensiUrl: string | null;
  beritaAcaraUrl: string | null;
  semester: { id: string; nama: string; tahunAkademik: { id: string; tahun: string } };
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

function StatusBadge({ status, isProdiApproved }: { status: string; isProdiApproved: boolean }) {
  if (status === 'APPROVED') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"><CheckCircle size={12} /> Disetujui</span>;
  if (status === 'REVISION') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700"><AlertCircle size={12} /> Revisi</span>;
  if (status === 'PENGECEKAN') {
    if (isProdiApproved) return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700"><Clock size={12} /> Menunggu Kaprodi</span>;
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700"><Clock size={12} /> Menunggu PRODI</span>;
  }
  if (status === 'SUBMITTED') return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Clock size={12} /> Diajukan</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"><XCircle size={12} /> Belum Lengkap</span>;
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

  return (
    <div>
      <button onClick={() => router.push(`/dashboard/berita-acara/kelas/${kelas.id}`)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-uph-blue mb-4 transition-colors">
        <ArrowLeft size={14} /> Kembali
      </button>

      <div className="mb-6">
        <h1 className="font-playfair text-2xl font-bold text-uph-blue">
          Kelas {kelas.name} — {tahunAkademik.tahun}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Dosen PA: {kelas.dosenPa.name}</p>
      </div>

      {/* Confirm unlock modal */}
      {confirmUnlock && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Unlock size={20} className="text-amber-600" />
              </div>
              <h2 className="font-playfair text-lg font-bold text-uph-blue">Buka Akses Semester</h2>
            </div>
            <p className="text-sm text-gray-600">
              Membuka akses BAP <strong>{confirmUnlock.semester.nama}</strong> untuk kelas <strong>{kelas.name}</strong>.
              Dosen PA <strong>{kelas.dosenPa.name}</strong> akan mendapat notifikasi untuk mengupload dokumen.
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setConfirmUnlock(null)}
                className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleUnlock} disabled={unlocking}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-uph-blue rounded-lg hover:bg-uph-blue/90 disabled:opacity-50">
                {unlocking && <Loader2 size={14} className="animate-spin" />}
                <Unlock size={14} /> Ya, Buka Akses
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sorted.map(bap => {
          const fileCount = [bap.lembarKehadiranUrl, bap.absensiUrl, bap.beritaAcaraUrl].filter(Boolean).length;
          const locked = !bap.isUnlocked;

          if (locked) {
            return (
              <div key={bap.id} className="bg-white border border-uph-border rounded-xl p-5 opacity-60 select-none">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Lock size={22} className="text-gray-400" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                    <Lock size={11} /> Terkunci
                  </span>
                </div>
                <p className="font-bold text-gray-500 text-lg">{bap.semester.nama}</p>
                <p className="text-xs text-gray-400 mt-1">Akses belum dibuka</p>
                {isKaprodi && (
                  <button
                    onClick={() => setConfirmUnlock(bap)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-uph-blue border border-uph-blue rounded-lg hover:bg-blue-50 transition-colors opacity-100">
                    <Unlock size={12} /> Buka Akses
                  </button>
                )}
              </div>
            );
          }

          const canAccess = isKaprodi || isProdi || isDosenPa;
          const inner = (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-uph-blue/10 flex items-center justify-center">
                  <FileText size={22} className="text-uph-blue" />
                </div>
                <StatusBadge status={bap.status} isProdiApproved={bap.isProdiApproved} />
              </div>
              <p className="font-bold text-gray-800 text-lg">{bap.semester.nama}</p>
              <p className="text-xs text-gray-400 mt-1">{fileCount}/3 file diupload</p>
            </>
          );

          return canAccess ? (
            <Link key={bap.id} href={`/dashboard/berita-acara/${bap.id}`}
              className="block bg-white border border-uph-border rounded-xl p-5 hover:border-uph-blue hover:shadow-sm transition-all">
              {inner}
            </Link>
          ) : (
            <div key={bap.id} className="bg-white border border-uph-border rounded-xl p-5">{inner}</div>
          );
        })}

        {sorted.length === 0 && (
          <div className="col-span-3 bg-white rounded-xl border border-uph-border p-12 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-semibold">Belum ada semester untuk tahun ini</p>
          </div>
        )}
      </div>
    </div>
  );
}
