"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Clock, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Bap {
  id: string;
  kelasName: string;
  semesterId: string;
  semester: { id: string; nama: string; tahunAkademik: { tahun: string } };
  dosenPa: { id: string; name: string };
  dosenPaId: string;
  lembarKehadiranUrl: string | null;
  absensiUrl: string | null;
  beritaAcaraUrl: string | null;
  status: string;
  isProdiApproved: boolean;
  prodiNotes: string | null;
  kaprodiNotes: string | null;
  createdAt: string;
  updatedAt: string;
  finalApprovedAt: string | null;
}

interface Props {
  baps: Bap[];
  semesters: { id: string; label: string; isActive: boolean }[];
  dosens: { id: string; name: string }[];
  isKaprodi: boolean;
  isProdi: boolean;
  userId: string;
}

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

export default function BapListClient({ baps: initialBaps, semesters, dosens, isKaprodi, isProdi, userId }: Props) {
  const router = useRouter();
  const [baps, setBaps] = useState(initialBaps);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ kelasName: '', semesterId: semesters.find(s => s.isActive)?.id ?? semesters[0]?.id ?? '', dosenPaId: dosens[0]?.id ?? '' });

  const handleCreate = async () => {
    if (!form.kelasName.trim() || !form.semesterId || !form.dosenPaId) return;
    setCreating(true);
    const res = await fetch('/api/bap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) {
      const bap = await res.json();
      setBaps(prev => [bap, ...prev]);
      setShowCreate(false);
      setForm(f => ({ ...f, kelasName: '' }));
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? 'Gagal membuat BAP');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-uph-blue">Berita Acara Perwalian</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pengelolaan dokumen perwalian per kelas per semester</p>
        </div>
        {isKaprodi && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-uph-blue text-white rounded-lg text-sm font-bold hover:bg-uph-blue/90 transition-colors">
            <Plus size={16} /> Buat BAP
          </button>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <h2 className="font-playfair text-lg font-bold text-uph-blue">Buat BAP Baru</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nama Kelas</label>
              <input value={form.kelasName} onChange={e => setForm(f => ({ ...f, kelasName: e.target.value }))}
                placeholder="Contoh: 23TI1" className="w-full border border-uph-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uph-blue/30" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Semester</label>
              <select value={form.semesterId} onChange={e => setForm(f => ({ ...f, semesterId: e.target.value }))}
                className="w-full border border-uph-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uph-blue/30">
                {semesters.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Dosen PA</label>
              <select value={form.dosenPaId} onChange={e => setForm(f => ({ ...f, dosenPaId: e.target.value }))}
                className="w-full border border-uph-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uph-blue/30">
                {dosens.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Batal</button>
              <button onClick={handleCreate} disabled={creating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-uph-blue rounded-lg hover:bg-uph-blue/90 disabled:opacity-50">
                {creating && <Loader2 size={14} className="animate-spin" />} Buat
              </button>
            </div>
          </div>
        </div>
      )}

      {baps.length === 0 ? (
        <div className="bg-white rounded-xl border border-uph-border p-12 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-semibold">Belum ada Berita Acara Perwalian</p>
          {isKaprodi && <p className="text-sm text-gray-400 mt-1">Klik &quot;Buat BAP&quot; untuk menambahkan.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {baps.map(bap => (
            <Link key={bap.id} href={`/dashboard/berita-acara/${bap.id}`}
              className="block bg-white border border-uph-border rounded-xl px-5 py-4 hover:border-uph-blue hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-uph-blue/10 flex items-center justify-center font-bold text-uph-blue text-sm">{bap.kelasName}</div>
                  <div>
                    <p className="font-bold text-gray-800">{bap.kelasName}</p>
                    <p className="text-xs text-gray-500">{bap.semester.tahunAkademik.tahun} — {bap.semester.nama} · Dosen PA: {bap.dosenPa.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{[bap.lembarKehadiranUrl, bap.absensiUrl, bap.beritaAcaraUrl].filter(Boolean).length}/3 file</span>
                  <StatusBadge status={bap.status} isProdiApproved={bap.isProdiApproved} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
