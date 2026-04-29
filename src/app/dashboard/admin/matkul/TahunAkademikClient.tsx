"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, ChevronRight, X, AlertTriangle, Trash2, Lock } from 'lucide-react';

type TahunAkademik = {
  id: string;
  tahun: string;
  isActive: boolean;
  semesters: { id: string; nama: string; isActive: boolean; _count: { matkuls: number } }[];
};

type Props = { items: TahunAkademik[] };

export function TahunAkademikClient({ items: initial }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [showModal, setShowModal] = useState(false);
  const [tahun, setTahun] = useState('');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TahunAkademik | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsAdding(true);
    try {
      const res = await fetch('/api/tahun-akademik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tahun }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Gagal membuat tahun akademik.'); return; }
      setItems(prev => [data, ...prev]);
      setShowModal(false);
      setTahun('');
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setIsAdding(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError('');
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tahun-akademik/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error ?? 'Gagal menghapus.'); return; }
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setDeleteError('Gagal terhubung ke server.');
    } finally {
      setIsDeleting(false);
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
          <Plus size={16} className="mr-2" /> Tambah Tahun Akademik
        </button>
      </div>

      {items.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Belum ada tahun akademik.</p>
          <p className="text-sm text-gray-400 mt-1">Klik "Tambah Tahun Akademik" untuk memulai.</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center border-b border-gray-100 bg-uph-blue/5">
              <button
                onClick={() => router.push(`/dashboard/admin/matkul/${item.id}`)}
                className="flex-1 flex items-center justify-between px-6 py-4 hover:bg-uph-blue/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-uph-blue">TA {item.tahun}</h2>
                  {item.isActive && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">AKTIF</span>
                  )}
                  <span className="text-sm text-gray-500">{item.semesters.length} semester</span>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-uph-blue transition-colors" />
              </button>
              <button
                onClick={() => { setDeleteTarget(item); setDeleteError(''); }}
                className="px-4 py-4 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Hapus tahun akademik"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {item.semesters.length > 0 && (
              <div className="px-6 py-3 flex flex-wrap gap-2">
                {item.semesters.map(sem => {
                  if (!sem.isActive) {
                    return (
                      <span
                        key={sem.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-400 cursor-not-allowed"
                      >
                        <Lock size={11} className="text-gray-300" />
                        <span>{sem.nama}</span>
                        <span className="text-xs text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded-full">{sem._count.matkuls} matkul</span>
                      </span>
                    );
                  }
                  return (
                    <button
                      key={sem.id}
                      onClick={() => router.push(`/dashboard/admin/matkul/${item.id}/${sem.id}`)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-uph-blue/20 hover:border-uph-blue hover:bg-uph-blue/5 transition-all text-sm font-medium text-gray-700 group"
                    >
                      <span className="group-hover:text-uph-blue transition-colors">{sem.nama}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{sem._count.matkuls} matkul</span>
                    </button>
                  );
                })}
              </div>
            )}

            {item.semesters.length === 0 && (
              <div className="px-6 py-3 text-sm text-gray-400 italic">
                Belum ada semester — klik tahun untuk menambahkan.
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Tambah Tahun Akademik</h2>
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
                  placeholder="2026/2027"
                  value={tahun}
                  onChange={e => setTahun(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue"
                />
                <p className="text-xs text-gray-400 mt-1">Format: YYYY/YYYY (cth: 2026/2027)</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(''); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={isAdding}
                  className="flex-1 py-2.5 bg-uph-blue text-white text-sm font-bold rounded-lg hover:bg-[#111c33] disabled:opacity-60">
                  {isAdding ? 'Menyimpan...' : 'Buat Tahun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Hapus Tahun Akademik</h2>
              <button onClick={() => setDeleteTarget(null)} className="p-1 hover:bg-gray-200 rounded-full">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Hapus <span className="font-bold text-uph-blue">TA {deleteTarget.tahun}</span> beserta semua semesternya? Tindakan ini tidak dapat dibatalkan.
              </p>
              {deleteError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{deleteError}</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button onClick={handleDelete} disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                  <Trash2 size={14} />
                  {isDeleting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
