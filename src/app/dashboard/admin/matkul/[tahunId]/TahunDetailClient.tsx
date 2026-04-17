"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft, ChevronRight, X, AlertTriangle, BookOpen } from 'lucide-react';

const SEMESTERS = ['Ganjil', 'Genap', 'Akselerasi'] as const;

type SemesterItem = {
  id: string;
  nama: string;
  isActive: boolean;
  _count: { matkuls: number };
};

type TahunAkademik = {
  id: string;
  tahun: string;
  isActive: boolean;
  semesters: SemesterItem[];
};

type Props = { tahun: TahunAkademik };

export function TahunDetailClient({ tahun: initial }: Props) {
  const router = useRouter();
  const [semesters, setSemesters] = useState(initial.semesters);
  const [showModal, setShowModal] = useState(false);
  const [nama, setNama] = useState<string>('Ganjil');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const existingNama = semesters.map(s => s.nama);
  const available = SEMESTERS.filter(s => !existingNama.includes(s));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsAdding(true);
    try {
      const res = await fetch(`/api/tahun-akademik/${initial.id}/semesters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Gagal membuat semester.'); return; }
      setSemesters(prev => [...prev, data].sort((a, b) => a.nama.localeCompare(b.nama)));
      setShowModal(false);
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.push('/dashboard/admin/matkul')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-uph-blue transition-colors font-medium">
          <ArrowLeft size={15} /> Semua Tahun
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">TA {initial.tahun}</h1>
          <p className="text-gray-500">Pilih atau tambahkan semester untuk mengelola mata kuliah.</p>
        </div>
        {available.length > 0 && (
          <button
            onClick={() => { setNama(available[0]); setShowModal(true); }}
            className="inline-flex items-center px-4 py-2 bg-uph-blue hover:bg-[#111c33] text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} className="mr-2" /> Tambah Semester
          </button>
        )}
      </div>

      {semesters.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Belum ada semester.</p>
          <p className="text-sm text-gray-400 mt-1">Tambahkan semester Ganjil, Genap, atau Akselerasi.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SEMESTERS.map(sem => {
          const existing = semesters.find(s => s.nama === sem);
          if (!existing) {
            return (
              <div key={sem} className="rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-2 text-gray-400">
                <span className="font-semibold">{sem}</span>
                <span className="text-xs">Belum dibuat</span>
              </div>
            );
          }
          return (
            <button
              key={sem}
              onClick={() => router.push(`/dashboard/admin/matkul/${initial.id}/${existing.id}`)}
              className="rounded-2xl border-2 border-uph-blue/20 hover:border-uph-blue hover:bg-uph-blue/5 p-6 flex items-center justify-between transition-all group text-left"
            >
              <div>
                <p className="font-bold text-lg text-gray-800 group-hover:text-uph-blue transition-colors">{sem}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {existing._count.matkuls} mata kuliah
                  {existing.isActive && (
                    <span className="ml-2 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">AKTIF</span>
                  )}
                </p>
              </div>
              <ChevronRight size={20} className="text-gray-400 group-hover:text-uph-blue transition-colors" />
            </button>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Tambah Semester</h2>
              <button onClick={() => { setShowModal(false); setError(''); }} className="p-1 hover:bg-gray-200 rounded-full">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <div className="p-3 bg-uph-blue/5 rounded-lg border border-uph-blue/10 text-sm text-uph-blue font-medium">
                Tahun Akademik: {initial.tahun}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Semester *</label>
                <select value={nama} onChange={e => setNama(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue bg-white">
                  {available.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(''); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={isAdding}
                  className="flex-1 py-2.5 bg-uph-blue text-white text-sm font-bold rounded-lg hover:bg-[#111c33] disabled:opacity-60">
                  {isAdding ? 'Menyimpan...' : 'Buat Semester'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
