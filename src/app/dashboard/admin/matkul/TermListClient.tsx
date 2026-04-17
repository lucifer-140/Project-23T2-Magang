"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, ChevronRight, X, AlertTriangle } from 'lucide-react';

const SEMESTERS = ['Ganjil', 'Genap', 'Akselerasi'] as const;

type Term = {
  id: string;
  tahunAkademik: string;
  semester: string;
  isActive: boolean;
  _count: { matkuls: number };
};

type Props = { terms: Term[] };

export function TermListClient({ terms: initialTerms }: Props) {
  const router = useRouter();
  const [terms, setTerms] = useState(initialTerms);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ tahunAkademik: '', semester: 'Ganjil' as string });
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Group by tahunAkademik descending
  const grouped = useMemo(() => {
    const map = new Map<string, Term[]>();
    for (const t of terms) {
      if (!map.has(t.tahunAkademik)) map.set(t.tahunAkademik, []);
      map.get(t.tahunAkademik)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [terms]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsAdding(true);
    try {
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Gagal membuat term.'); return; }
      setTerms(prev => [...prev, data]);
      setShowModal(false);
      setForm({ tahunAkademik: '', semester: 'Ganjil' });
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Penugasan Mata Kuliah</h1>
          <p className="text-gray-500">Kelola mata kuliah per tahun akademik dan semester.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-uph-blue hover:bg-[#111c33] text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
        >
          <Plus size={16} className="mr-2" /> Tambah Term
        </button>
      </div>

      {terms.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Belum ada tahun akademik.</p>
          <p className="text-sm text-gray-400 mt-1">Klik "Tambah Term" untuk memulai.</p>
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([tahunAkademik, termList]) => (
          <div key={tahunAkademik} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-uph-blue/5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-uph-blue">TA {tahunAkademik}</h2>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SEMESTERS.map(sem => {
                const term = termList.find(t => t.semester === sem);
                if (!term) {
                  return (
                    <div key={sem}
                      className="rounded-xl border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center gap-1 text-gray-400">
                      <span className="text-sm font-medium">{sem}</span>
                      <span className="text-xs">Belum dibuat</span>
                    </div>
                  );
                }
                return (
                  <button
                    key={sem}
                    onClick={() => router.push(`/dashboard/admin/matkul/${term.id}`)}
                    className="rounded-xl border-2 border-uph-blue/20 hover:border-uph-blue hover:bg-uph-blue/5 p-4 flex items-center justify-between transition-all group text-left"
                  >
                    <div>
                      <p className="font-bold text-gray-800 group-hover:text-uph-blue transition-colors">{sem}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {term._count.matkuls} mata kuliah
                        {term.isActive && (
                          <span className="ml-2 text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">AKTIF</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-uph-blue transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Tambah Term */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Tambah Term Baru</h2>
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
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Tahun Akademik *
                </label>
                <input
                  required
                  placeholder="2025/2026"
                  value={form.tahunAkademik}
                  onChange={e => setForm(p => ({ ...p, tahunAkademik: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Semester *
                </label>
                <select
                  value={form.semester}
                  onChange={e => setForm(p => ({ ...p, semester: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue bg-white"
                >
                  {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(''); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 py-2.5 bg-uph-blue text-white text-sm font-bold rounded-lg hover:bg-[#111c33] disabled:opacity-60"
                >
                  {isAdding ? 'Menyimpan...' : 'Buat Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
