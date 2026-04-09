"use client";

import { useState, useMemo } from 'react';
import { BookOpen, Plus, Edit2, Users, AlertTriangle, X, Trash2, Search, GraduationCap } from 'lucide-react';

// Types
type Dosen = { id: string; name: string; email: string };
type Koordinator = { id: string; name: string; email: string };
type Matkul = {
  id: string; code: string; name: string; sks: number;
  dosens: Dosen[];
  koordinators: Koordinator[];
};

type Props = {
  matkuls: Matkul[];
  dosens: Dosen[];
  koordinators: Koordinator[];
};

export function MatkulClientPage({ matkuls: initialMatkuls, dosens, koordinators }: Props) {
  const [matkuls, setMatkuls] = useState(initialMatkuls);

  // Modal: Add Matkul
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ code: '', name: '', sks: '3' });

  // Modal: Assign Dosen
  const [assigningMatkul, setAssigningMatkul] = useState<Matkul | null>(null);
  const [dosenSearch, setDosenSearch] = useState('');

  // Modal: Assign Koordinator
  const [assigningKoordMatkul, setAssigningKoordMatkul] = useState<Matkul | null>(null);
  const [koordSearch, setKoordSearch] = useState('');

  // Modal: Request Change
  const [changingMatkul, setChangingMatkul] = useState<Matkul | null>(null);
  const [changeForm, setChangeForm] = useState({ proposedName: '', proposedCode: '', proposedSks: '', reason: '' });

  // Modal: Delete Matkul
  const [deletingMatkul, setDeletingMatkul] = useState<Matkul | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered Lists for Assignment
  const filteredDosens = useMemo(() => {
    return dosens.filter(d => d.name.toLowerCase().includes(dosenSearch.toLowerCase()) || d.email.toLowerCase().includes(dosenSearch.toLowerCase()));
  }, [dosens, dosenSearch]);

  const filteredKoordinators = useMemo(() => {
    return koordinators.filter(k => k.name.toLowerCase().includes(koordSearch.toLowerCase()) || k.email.toLowerCase().includes(koordSearch.toLowerCase()));
  }, [koordinators, koordSearch]);

  async function handleAddMatkul(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/matkul', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      const data = await res.json();
      const newMatkul = { ...data, dosens: [], koordinators: [] };
      setMatkuls(prev => [...prev, newMatkul]);
      setShowAddModal(false);
      setAddForm({ code: '', name: '', sks: '3' });
    }
  }

  async function handleDeleteMatkul() {
    if (!deletingMatkul) return;
    setIsDeleting(true);
    const res = await fetch(`/api/matkul/${deletingMatkul.id}`, { method: 'DELETE' });
    if (res.ok) {
      setMatkuls(prev => prev.filter(m => m.id !== deletingMatkul.id));
      setDeletingMatkul(null);
    } else {
      alert("Gagal menghapus matkul.");
    }
    setIsDeleting(false);
  }

  async function handleAssignDosen(dosenId: string, checked: boolean) {
    if (!assigningMatkul) return;
    
    if (!checked) {
      const confirmed = window.confirm("Anda yakin ingin menghapus dosen ini dari mata kuliah?");
      if (!confirmed) return;
    }

    const matkulId = assigningMatkul.id;
    const updatedDosens = checked
      ? [...assigningMatkul.dosens, dosens.find(d => d.id === dosenId)!]
      : assigningMatkul.dosens.filter(d => d.id !== dosenId);

    const updatedMatkul = { ...assigningMatkul, dosens: updatedDosens };
    setAssigningMatkul(updatedMatkul);
    setMatkuls(prev => prev.map(m => m.id === matkulId ? updatedMatkul : m));

    await fetch(`/api/matkul/${matkulId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dosenId, action: checked ? 'add' : 'remove' }),
    });
  }

  async function handleAssignKoordinator(koordinatorId: string, checked: boolean) {
    if (!assigningKoordMatkul) return;

    if (!checked) {
      const confirmed = window.confirm("Anda yakin ingin menghapus koordinator ini dari mata kuliah?");
      if (!confirmed) return;
    }

    const matkulId = assigningKoordMatkul.id;
    const updatedKoordinators = checked
      ? [...assigningKoordMatkul.koordinators, koordinators.find(k => k.id === koordinatorId)!]
      : assigningKoordMatkul.koordinators.filter(k => k.id !== koordinatorId);

    const updatedMatkul = { ...assigningKoordMatkul, koordinators: updatedKoordinators };
    setAssigningKoordMatkul(updatedMatkul);
    setMatkuls(prev => prev.map(m => m.id === matkulId ? updatedMatkul : m));

    await fetch(`/api/matkul/${matkulId}/assign-coordinator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ koordinatorId, action: checked ? 'add' : 'remove' }),
    });
  }

  async function handleSubmitChangeRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!changingMatkul) return;
    await fetch(`/api/matkul/${changingMatkul.id}/change-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changeForm),
    });
    setChangingMatkul(null);
    setChangeForm({ proposedName: '', proposedCode: '', proposedSks: '', reason: '' });
    alert('Permintaan perubahan telah dikirim ke Kaprodi untuk di-review.');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Kelola Mata Kuliah</h1>
          <p className="text-gray-500">Tambah matkul, atur pengajar dan koordinator, atau hapus dan edit data.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-uph-blue hover:bg-[#111c33] text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
        >
          <Plus size={16} className="mr-2" /> Tambah Matkul
        </button>
      </div>

      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
        <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-yellow-800">
          <strong>Perhatian:</strong> Mengedit data matkul yang sudah ada (nama, kode, SKS) akan mengirim permintaan ke <strong>Kaprodi</strong> untuk disetujui terlebih dahulu. Penghapusan matkul dan assigniment dosen bersifat final.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kode</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">Nama Mata Kuliah</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">SKS</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Koordinator & Dosen</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {matkuls.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6">
                  <span className="inline-block bg-uph-blue/10 text-uph-blue text-xs font-bold px-2 py-1 rounded uppercase">{m.code}</span>
                </td>
                <td className="py-4 px-6 font-semibold text-gray-800">{m.name}</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">{m.sks} SKS</span>
                </td>
                <td className="py-4 px-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">KOORD:</span>
                      {m.koordinators?.length === 0 ? <span className="text-xs text-gray-400 italic">Belum assign</span> : m.koordinators?.map(k => (
                        <span key={k.id} className="text-[11px] bg-uph-blue text-white px-2 py-0.5 rounded-full font-medium">{k.name}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">DOSEN:</span>
                      {m.dosens?.length === 0 ? <span className="text-xs text-gray-400 italic">Belum assign</span> : m.dosens?.map(d => (
                        <span key={d.id} className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium border border-teal-100">{d.name}</span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setAssigningKoordMatkul(m); setKoordSearch(''); }}
                        className="inline-flex items-center px-2 py-1.5 bg-uph-blue/5 hover:bg-uph-blue/10 text-uph-blue text-[11px] font-bold rounded transition-colors"
                        title="Assign Koordinator"
                      >
                        <GraduationCap size={13} /> +Koord
                      </button>
                      <button
                        onClick={() => { setAssigningMatkul(m); setDosenSearch(''); }}
                        className="inline-flex items-center px-2 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold rounded transition-colors"
                        title="Assign Dosen"
                      >
                        <Users size={13} /> +Dosen
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setChangingMatkul(m); setChangeForm({ proposedName: m.name, proposedCode: m.code, proposedSks: String(m.sks), reason: '' }); }}
                        className="inline-flex items-center px-2 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-[11px] font-bold rounded transition-colors"
                        title="Edit Data Matkul"
                      >
                        <Edit2 size={13} /> Edit Data
                      </button>
                      <button
                        onClick={() => setDeletingMatkul(m)}
                        className="inline-flex items-center px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded transition-colors"
                        title="Hapus Matkul"
                      >
                        <Trash2 size={13} /> Hapus
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {matkuls.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">Belum ada mata kuliah.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Delete Matkul Confirm */}
      {deletingMatkul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Hapus Mata Kuliah?</h2>
                <p className="text-sm text-red-600 font-medium">Tindakan fatal</p>
              </div>
              <button onClick={() => setDeletingMatkul(null)} className="p-1 hover:bg-red-100 rounded-full"><X size={18} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                Apakah Anda yakin ingin menghapus matkul <strong>{deletingMatkul.code} - {deletingMatkul.name}</strong> secara permanen?
                Semua RPS dan izin terkait akan terhapus.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingMatkul(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button onClick={handleDeleteMatkul} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {isDeleting ? "Menghapus..." : "Hapus Permanen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Matkul */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Tambah Mata Kuliah Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddMatkul} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Kode Matkul</label>
                <input required value={addForm.code} onChange={e => setAddForm(p => ({ ...p, code: e.target.value }))}
                  placeholder="Cth: CS101" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nama Mata Kuliah</label>
                <input required value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Cth: Algoritma & Pemrograman" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">SKS</label>
                <input type="number" required min={1} max={6} value={addForm.sks} onChange={e => setAddForm(p => ({ ...p, sks: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue" placeholder="Cth: 3" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-uph-blue text-white text-sm font-bold rounded-lg hover:bg-[#111c33]">Tambahkan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Dosen */}
      {assigningMatkul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Assign Dosen</h2>
                <p className="text-sm text-gray-500">{assigningMatkul.code} - {assigningMatkul.name}</p>
              </div>
              <button onClick={() => setAssigningMatkul(null)} className="p-1 hover:bg-gray-200 rounded-full"><X size={18} /></button>
            </div>
            <div className="px-6 py-3 border-b border-gray-100">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" placeholder="Cari nama dosen atau email..." value={dosenSearch} onChange={e => setDosenSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-uph-blue"
                  />
               </div>
            </div>
            <div className="p-6 space-y-2 overflow-y-auto flex-1">
              {filteredDosens.length === 0 ? <p className="text-center text-sm text-gray-400">Pencarian tidak ditemukan.</p> : filteredDosens.map(d => {
                const isAssigned = assigningMatkul.dosens.some(ad => ad.id === d.id);
                return (
                  <label key={d.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-colors ${isAssigned ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.email}</p>
                    </div>
                    <input type="checkbox" checked={isAssigned} onChange={e => handleAssignDosen(d.id, e.target.checked)} className="w-4 h-4 accent-teal-600" />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assign Koordinator */}
      {assigningKoordMatkul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Assign Koordinator</h2>
                <p className="text-sm text-gray-500">{assigningKoordMatkul.code} - {assigningKoordMatkul.name}</p>
              </div>
              <button onClick={() => setAssigningKoordMatkul(null)} className="p-1 hover:bg-gray-200 rounded-full"><X size={18} /></button>
            </div>
            <div className="px-6 py-3 border-b border-gray-100">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input type="text" placeholder="Cari koordinator atau email..." value={koordSearch} onChange={e => setKoordSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-uph-blue"
                  />
               </div>
            </div>
            <div className="p-6 space-y-2 overflow-y-auto flex-1">
              {filteredKoordinators.length === 0 ? <p className="text-center text-sm text-gray-400">Pencarian tidak ditemukan.</p> : filteredKoordinators.map(k => {
                const isAssigned = assigningKoordMatkul.koordinators.some(ad => ad.id === k.id);
                return (
                  <label key={k.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-colors ${isAssigned ? 'bg-uph-blue/10 border-uph-blue' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{k.name}</p>
                      <p className="text-xs text-gray-500">{k.email}</p>
                    </div>
                    <input type="checkbox" checked={isAssigned} onChange={e => handleAssignKoordinator(k.id, e.target.checked)} className="w-4 h-4 accent-uph-blue" />
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Change */}
      {changingMatkul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-yellow-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Ajukan Perubahan Data</h2>
                <p className="text-sm text-yellow-700 font-medium">Perlu persetujuan Kaprodi</p>
              </div>
              <button onClick={() => setChangingMatkul(null)} className="p-1 hover:bg-yellow-200 rounded-full"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmitChangeRequest} className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
                <strong>Data saat ini:</strong> {changingMatkul.code} - {changingMatkul.name} ({changingMatkul.sks} SKS)
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nama Baru (opsional)</label>
                <input value={changeForm.proposedName} onChange={e => setChangeForm(p => ({ ...p, proposedName: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Kode Baru (opsional)</label>
                <input value={changeForm.proposedCode} onChange={e => setChangeForm(p => ({ ...p, proposedCode: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">SKS Baru (opsional)</label>
                <input type="number" min={1} max={6} value={changeForm.proposedSks} onChange={e => setChangeForm(p => ({ ...p, proposedSks: e.target.value }))}
                  placeholder="Kosongkan jika tidak berubah" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Alasan Perubahan *</label>
                <textarea required value={changeForm.reason} onChange={e => setChangeForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500 min-h-[80px] resize-none"
                  placeholder="Jelaskan alasan perubahan ini..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setChangingMatkul(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-yellow-500 text-white text-sm font-bold rounded-lg hover:bg-yellow-600">Kirim Permintaan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
