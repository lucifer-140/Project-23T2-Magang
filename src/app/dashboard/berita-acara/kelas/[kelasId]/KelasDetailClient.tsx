"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, CalendarDays, FileText, Loader2, Trash2, UserCog } from 'lucide-react';
import Link from 'next/link';

interface Props {
  kelas: { id: string; name: string; dosenPa: { id: string; name: string }; createdAt: string };
  tahunList: { tahunAkademik: { id: string; tahun: string; isActive: boolean }; bapCount: number }[];
  availableTahun: { id: string; tahun: string; isActive: boolean }[];
  dosens: { id: string; name: string }[];
  isKaprodi: boolean;
}

export default function KelasDetailClient({ kelas: initialKelas, tahunList: initial, availableTahun: initialAvail, dosens, isKaprodi }: Props) {
  const router = useRouter();
  const [kelas, setKelas] = useState(initialKelas);
  const [tahunList, setTahunList] = useState(initial);
  const [availableTahun, setAvailableTahun] = useState(initialAvail);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedTahunId, setSelectedTahunId] = useState(initialAvail[0]?.id ?? '');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; tahun: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [reassignId, setReassignId] = useState(initialKelas.dosenPa.id);
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(id);
  }, [router]);

  const handleAdd = async () => {
    if (!selectedTahunId) return;
    setAdding(true);
    const res = await fetch(`/api/kelas/${kelas.id}/tahun`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tahunAkademikId: selectedTahunId }),
    });
    setAdding(false);
    if (res.ok) {
      setShowAdd(false);
      router.push(`/dashboard/berita-acara/kelas/${kelas.id}/${selectedTahunId}`);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? 'Gagal menambahkan tahun akademik');
    }
  };

  const handleReassign = async () => {
    setReassigning(true);
    const res = await fetch(`/api/kelas/${kelas.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dosenPaId: reassignId }),
    });
    setReassigning(false);
    if (res.ok) {
      const data = await res.json();
      setKelas(prev => ({ ...prev, dosenPa: data.dosenPa, dosenPaId: data.dosenPaId }));
      setShowReassign(false);
    } else {
      alert('Gagal mengganti Dosen PA');
    }
  };

  const handleDeleteTahun = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const res = await fetch(`/api/kelas/${kelas.id}/tahun/${confirmDelete.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      const removed = tahunList.find(t => t.tahunAkademik.id === confirmDelete.id);
      setTahunList(prev => prev.filter(t => t.tahunAkademik.id !== confirmDelete.id));
      if (removed) setAvailableTahun(prev => [removed.tahunAkademik, ...prev].sort((a, b) => b.tahun.localeCompare(a.tahun)));
      setConfirmDelete(null);
    } else {
      alert('Gagal menghapus tahun akademik');
    }
  };

  return (
    <div>
      <button onClick={() => router.push('/dashboard/berita-acara')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-uph-blue mb-4 transition-colors">
        <ArrowLeft size={14} /> Kembali
      </button>

      <div className="mb-6">
        <div className="flex items-start justify-between">
          <h1 className="font-playfair text-2xl font-bold text-uph-blue">Kelas {kelas.name}</h1>
          {/* Tambah Tahun Akademik — blocked pending review of auto-create flow */}
          {/* {isKaprodi && availableTahun.length > 0 && (
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-uph-blue text-white rounded-lg text-sm font-bold hover:bg-uph-blue/90 transition-colors">
              <Plus size={16} /> Tambah Tahun Akademik
            </button>
          )} */}
        </div>

        {/* Dosen PA info bar */}
        <div className="mt-3 flex items-center justify-between bg-white border border-uph-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <UserCog size={18} className="text-uph-blue flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Dosen PA</p>
              <p className="font-semibold text-gray-800">{kelas.dosenPa.name}</p>
            </div>
          </div>
          {isKaprodi && (
            <button
              onClick={() => { setReassignId(kelas.dosenPa.id); setShowReassign(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-uph-blue border border-uph-blue rounded-lg hover:bg-blue-50 transition-colors">
              <UserCog size={14} /> Ganti Dosen PA
            </button>
          )}
        </div>
      </div>

      {/* Add tahun modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <h2 className="font-playfair text-lg font-bold text-uph-blue">Tambah Tahun Akademik</h2>
            <p className="text-sm text-gray-500">Akan otomatis membuat BAP untuk semester Ganjil, Genap, dan Akselerasi.</p>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tahun Akademik</label>
              <select value={selectedTahunId} onChange={e => setSelectedTahunId(e.target.value)}
                className="w-full border border-uph-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uph-blue/30">
                {availableTahun.map(t => (
                  <option key={t.id} value={t.id}>{t.tahun}{t.isActive ? ' (Aktif)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleAdd} disabled={adding || !selectedTahunId}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-uph-blue rounded-lg hover:bg-uph-blue/90 disabled:opacity-50">
                {adding && <Loader2 size={14} className="animate-spin" />} Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete tahun confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <h2 className="font-playfair text-lg font-bold text-uph-blue">Hapus Tahun Akademik</h2>
            <p className="text-sm text-gray-600">
              Hapus <strong>{confirmDelete.tahun}</strong> dari kelas <strong>{kelas.name}</strong>?
              Semua data BAP semester (Ganjil, Genap, Akselerasi) untuk tahun ini akan dihapus.
            </p>
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleDeleteTahun} disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-uph-red rounded-lg hover:bg-uph-red/90 disabled:opacity-50">
                {deleting && <Loader2 size={14} className="animate-spin" />}
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Dosen PA modal */}
      {showReassign && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-uph-blue/10 flex items-center justify-center">
                <UserCog size={20} className="text-uph-blue" />
              </div>
              <h2 className="font-playfair text-lg font-bold text-uph-blue">Ganti Dosen PA</h2>
            </div>
            <p className="text-sm text-gray-500">Dosen PA saat ini: <span className="font-semibold text-gray-700">{kelas.dosenPa.name}</span></p>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Dosen PA Baru</label>
              <select value={reassignId} onChange={e => setReassignId(e.target.value)}
                className="w-full border border-uph-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-uph-blue/30">
                {dosens.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              Perubahan berlaku untuk semua semester di kelas ini.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowReassign(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                Batal
              </button>
              <button onClick={handleReassign} disabled={reassigning || reassignId === kelas.dosenPa.id}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-uph-blue rounded-lg hover:bg-uph-blue/90 disabled:opacity-50">
                {reassigning && <Loader2 size={14} className="animate-spin" />} Konfirmasi Ganti
              </button>
            </div>
          </div>
        </div>
      )}

      {tahunList.length === 0 ? (
        <div className="bg-white rounded-xl border border-uph-border p-12 text-center">
          <CalendarDays size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-semibold">Belum ada tahun akademik</p>
          {isKaprodi && <p className="text-sm text-gray-400 mt-1">Klik &quot;Tambah Tahun Akademik&quot; untuk menambahkan.</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {tahunList.map(({ tahunAkademik, bapCount }) => (
            <div key={tahunAkademik.id} className="flex items-center gap-2">
              <Link href={`/dashboard/berita-acara/kelas/${kelas.id}/${tahunAkademik.id}`}
                className="flex-1 block bg-white border border-uph-border rounded-xl px-5 py-4 hover:border-uph-blue hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-uph-blue/10 flex items-center justify-center">
                      <CalendarDays size={18} className="text-uph-blue" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{tahunAkademik.tahun}</p>
                      {tahunAkademik.isActive && (
                        <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Aktif</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <FileText size={12} /> {bapCount} semester
                  </span>
                </div>
              </Link>
              {isKaprodi && (
                <button onClick={() => setConfirmDelete({ id: tahunAkademik.id, tahun: tahunAkademik.tahun })}
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
