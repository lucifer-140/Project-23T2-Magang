"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Users, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface KelasItem {
  id: string;
  name: string;
  dosenPaId: string;
  dosenPa: { id: string; name: string };
  _count: { baps: number };
  createdAt: string;
}

interface Props {
  kelasList: KelasItem[];
  dosens: { id: string; name: string }[];
  isKaprodi: boolean;
  isProdi: boolean;
  userId: string;
}

export default function KelasListClient({ kelasList: initial, dosens, isKaprodi }: Props) {
  const router = useRouter();
  const [kelasList, setKelasList] = useState(initial);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(id);
  }, [router]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', dosenPaId: dosens[0]?.id ?? '' });
  const [confirmDelete, setConfirmDelete] = useState<KelasItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.dosenPaId) return;
    setCreating(true);
    const res = await fetch('/api/kelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setCreating(false);
    if (res.ok) {
      const kelas = await res.json();
      setKelasList(prev => [...prev, kelas].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreate(false);
      setForm(f => ({ ...f, name: '' }));
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? 'Gagal membuat kelas');
    }
  };

  const handleDeleteKelas = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const res = await fetch(`/api/kelas/${confirmDelete.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      setKelasList(prev => prev.filter(k => k.id !== confirmDelete.id));
      setConfirmDelete(null);
    } else {
      alert('Gagal menghapus kelas');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-uph-blue">Berita Acara Perwalian</h1>
          <p className="text-sm text-gray-500 mt-0.5">Pengelolaan dokumen perwalian per kelas</p>
        </div>
        {isKaprodi && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-uph-blue text-white rounded-lg text-sm font-bold hover:bg-uph-blue/90 transition-colors">
            <Plus size={16} /> Buat Kelas
          </button>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <h2 className="font-playfair text-lg font-bold text-uph-blue">Buat Kelas Baru</h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nama Kelas</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Contoh: 23TI1"
                className="w-full border border-uph-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uph-blue/30" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Dosen PA</label>
              <select value={form.dosenPaId} onChange={e => setForm(f => ({ ...f, dosenPaId: e.target.value }))}
                className="w-full border border-uph-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uph-blue/30">
                {dosens.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleCreate} disabled={creating || !form.name.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-uph-blue rounded-lg hover:bg-uph-blue/90 disabled:opacity-50">
                {creating && <Loader2 size={14} className="animate-spin" />} Buat
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <h2 className="font-playfair text-lg font-bold text-uph-blue">Hapus Kelas</h2>
            <p className="text-sm text-gray-600">
              Hapus kelas <strong>{confirmDelete.name}</strong>? Semua data BAP di dalamnya akan dihapus.
            </p>
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleDeleteKelas} disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-uph-red rounded-lg hover:bg-uph-red/90 disabled:opacity-50">
                {deleting && <Loader2 size={14} className="animate-spin" />}
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {kelasList.length === 0 ? (
        <div className="bg-white rounded-xl border border-uph-border p-12 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-semibold">Belum ada kelas</p>
          {isKaprodi && <p className="text-sm text-gray-400 mt-1">Klik &quot;Buat Kelas&quot; untuk menambahkan.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {kelasList.map(kelas => (
            <div key={kelas.id} className="flex items-center gap-2">
              <Link href={`/dashboard/berita-acara/kelas/${kelas.id}`}
                className="flex-1 block bg-white border border-uph-border rounded-xl px-5 py-4 hover:border-uph-blue hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-uph-blue/10 flex items-center justify-center font-bold text-uph-blue text-sm">
                      {kelas.name.slice(0, 4)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{kelas.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Users size={11} /> Dosen PA: {kelas.dosenPa.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{kelas._count.baps} semester</span>
                </div>
              </Link>
              {isKaprodi && (
                <button onClick={() => setConfirmDelete(kelas)}
                  className="p-2.5 text-gray-400 hover:text-uph-red hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
