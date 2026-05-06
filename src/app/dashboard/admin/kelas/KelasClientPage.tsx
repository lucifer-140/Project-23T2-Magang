"use client";

import { useState, useMemo } from 'react';
import { Plus, Lock, Unlock, Pencil, Trash2, Search, AlertTriangle } from 'lucide-react';

type KelasRow = {
  id: string;
  name: string;
  isLocked: boolean;
  dosenPa: { id: string; name: string } | null;
  bapCount: number;
  matkulClassCount: number;
  createdAt: string;
};

type Props = { kelas: KelasRow[] };

export default function KelasClientPage({ kelas: initialKelas }: Props) {
  const [kelas, setKelas] = useState<KelasRow[]>(initialKelas);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addError, setAddError] = useState('');

  // Edit modal
  const [editTarget, setEditTarget] = useState<KelasRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<KelasRow | null>(null);

  const filtered = useMemo(
    () => kelas.filter(k => k.name.toLowerCase().includes(search.toLowerCase())),
    [kelas, search]
  );

  async function fetchAll() {
    const res = await fetch('/api/kelas');
    if (res.ok) {
      const data = await res.json();
      setKelas(
        data.map((k: KelasRow & { _count?: { baps: number; matkulClasses: number } }) => ({
          ...k,
          bapCount: k._count?.baps ?? k.bapCount,
          matkulClassCount: k._count?.matkulClasses ?? k.matkulClassCount,
        }))
      );
    }
  }

  async function handleAdd() {
    setAddError('');
    if (!addName.trim()) { setAddError('Nama kelas wajib diisi'); return; }
    setLoading(true);
    const res = await fetch('/api/kelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: addName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setAddError(data.error ?? 'Gagal menambah kelas'); return; }
    setShowAdd(false);
    setAddName('');
    await fetchAll();
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError('');
    if (!editName.trim()) { setEditError('Nama kelas wajib diisi'); return; }
    setLoading(true);
    const res = await fetch(`/api/kelas/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setEditError(data.error ?? 'Gagal menyimpan perubahan'); return; }
    setEditTarget(null);
    await fetchAll();
  }

  async function handleToggleLock(row: KelasRow) {
    setError('');
    const res = await fetch(`/api/kelas/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLocked: !row.isLocked }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Gagal mengubah status kelas');
      return;
    }
    setKelas(prev => prev.map(k => k.id === row.id ? { ...k, isLocked: !k.isLocked } : k));
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    const res = await fetch(`/api/kelas/${deleteTarget.id}`, { method: 'DELETE' });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Gagal menghapus kelas');
      setDeleteTarget(null);
      return;
    }
    setDeleteTarget(null);
    await fetchAll();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-uph-blue font-serif">Kelola Kelas</h1>
        <p className="text-sm text-gray-500 mt-1">Daftar kelas mahasiswa — kelas terkunci tidak dapat dipilih saat penugasan dosen.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle size={16} />
          {error}
          <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-uph-border shadow-sm">
        <div className="p-4 flex items-center gap-3 border-b border-uph-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue"
              placeholder="Cari kelas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setShowAdd(true); setAddName(''); setAddError(''); }}
            className="flex items-center gap-1.5 bg-uph-blue text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={15} /> Tambah Kelas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Nama Kelas</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Dosen PA</th>
                <th className="px-4 py-3 text-center">Digunakan di Matkul</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    {search ? 'Tidak ada kelas yang cocok' : 'Belum ada kelas. Tambah kelas baru.'}
                  </td>
                </tr>
              )}
              {filtered.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                  <td className="px-4 py-3">
                    {row.isLocked ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        <Lock size={10} /> Terkunci
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        <Unlock size={10} /> Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.dosenPa?.name ?? <span className="text-gray-300 italic">Belum ditugaskan</span>}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-500">{row.matkulClassCount} kelas</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleToggleLock(row)}
                        title={row.isLocked ? 'Aktifkan kelas' : 'Kunci kelas'}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-uph-blue hover:bg-blue-50 transition-colors"
                      >
                        {row.isLocked ? <Unlock size={15} /> : <Lock size={15} />}
                      </button>
                      <button
                        onClick={() => { setEditTarget(row); setEditName(row.name); setEditError(''); }}
                        title="Edit nama"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-uph-blue hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(row)}
                        title="Hapus kelas"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-uph-red hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-uph-border text-xs text-gray-400">
          {filtered.length} dari {kelas.length} kelas
        </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-uph-blue mb-4">Tambah Kelas</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
            <input
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-uph-blue uppercase"
              placeholder="Contoh: 24TI1"
              value={addName}
              onChange={e => setAddName(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleAdd}
                disabled={loading}
                className="px-4 py-2 text-sm bg-uph-blue text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Tambah'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-uph-blue mb-4">Edit Nama Kelas</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
            <input
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-uph-blue uppercase"
              value={editName}
              onChange={e => setEditName(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleEdit()}
            />
            {editError && <p className="text-red-500 text-xs mt-1">{editError}</p>}
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => setEditTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleEdit}
                disabled={loading}
                className="px-4 py-2 text-sm bg-uph-blue text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle size={20} className="text-uph-red" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Hapus Kelas?</h2>
            </div>
            <p className="text-sm text-gray-600">
              Kelas <strong>{deleteTarget.name}</strong> akan dihapus permanen.
              {deleteTarget.bapCount > 0 && (
                <span className="block mt-1 text-red-600">
                  Kelas ini memiliki {deleteTarget.bapCount} BAP yang juga akan terhapus.
                </span>
              )}
            </p>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 text-sm bg-uph-red text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
