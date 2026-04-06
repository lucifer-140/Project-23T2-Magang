"use client";

import { useState } from 'react';
import { BookOpen, Plus, Edit2, Users, AlertTriangle, X } from 'lucide-react';

// Types
type Dosen = { id: string; name: string; username: string };
type Matkul = {
  id: string; code: string; name: string; sks: number;
  dosens: Dosen[];
};

type Props = {
  matkuls: Matkul[];
  dosens: Dosen[];
};

export function MatkulClientPage({ matkuls: initialMatkuls, dosens }: Props) {
  const [matkuls, setMatkuls] = useState(initialMatkuls);

  // Modal: Add Matkul
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ code: '', name: '', sks: '3' });

  // Modal: Assign Dosen
  const [assigningMatkul, setAssigningMatkul] = useState<Matkul | null>(null);

  // Modal: Request Change
  const [changingMatkul, setChangingMatkul] = useState<Matkul | null>(null);
  const [changeForm, setChangeForm] = useState({ proposedName: '', proposedCode: '', proposedSks: '', reason: '' });

  async function handleAddMatkul(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/matkul', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      const newMatkul = await res.json();
      setMatkuls(prev => [...prev, newMatkul]);
      setShowAddModal(false);
      setAddForm({ code: '', name: '', sks: '3' });
    }
  }

  /**
   * FIX: Instant-assign on checkbox change.
   * Updates both the master `matkuls` list AND the `assigningMatkul` state
   * simultaneously to prevent the double-click desync bug.
   */
  async function handleAssignDosen(dosenId: string, checked: boolean) {
    if (!assigningMatkul) return;

    const matkulId = assigningMatkul.id;

    // Build the updated dosens array first
    const updatedDosens = checked
      ? [...assigningMatkul.dosens, dosens.find(d => d.id === dosenId)!]
      : assigningMatkul.dosens.filter(d => d.id !== dosenId);

    // FIX: Update BOTH the modal state and the main table state together so
    // the checkbox renders the correct `checked` value immediately (no double-click needed).
    const updatedMatkul = { ...assigningMatkul, dosens: updatedDosens };
    setAssigningMatkul(updatedMatkul);
    setMatkuls(prev => prev.map(m => m.id === matkulId ? updatedMatkul : m));

    // Fire API in the background
    await fetch(`/api/matkul/${matkulId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dosenId, action: checked ? 'add' : 'remove' }),
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
          <p className="text-gray-500">Tambah matkul baru, assign ke dosen, atau ajukan perubahan data ke Kaprodi.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-uph-blue hover:bg-[#111c33] text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
        >
          <Plus size={16} className="mr-2" /> Tambah Matkul
        </button>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
        <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-yellow-800">
          <strong>Perhatian:</strong> Mengedit data matkul yang sudah ada (nama, kode, SKS) akan mengirim permintaan ke <strong>Kaprodi</strong> untuk disetujui terlebih dahulu.
        </p>
      </div>

      {/* Matkul Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kode</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Mata Kuliah</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">SKS</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dosen Pengampu</th>
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
                  {m.dosens.length === 0 ? (
                    <span className="text-sm text-gray-400 italic">Belum ada dosen</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {/* FIX: Use d.id as key - always unique, never duplicated */}
                      {m.dosens.map(d => (
                        <span key={d.id} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">{d.name}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-4 px-6 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setAssigningMatkul(m)}
                      className="inline-flex items-center px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-bold rounded-lg transition-colors"
                    >
                      <Users size={13} className="mr-1.5" /> Assign Dosen
                    </button>
                    <button
                      onClick={() => { setChangingMatkul(m); setChangeForm({ proposedName: m.name, proposedCode: m.code, proposedSks: String(m.sks), reason: '' }); }}
                      className="inline-flex items-center px-3 py-1.5 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 text-xs font-bold rounded-lg transition-colors"
                    >
                      <Edit2 size={13} className="mr-1.5" /> Edit Data
                    </button>
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
              {/* FIX: Changed from <select> to <input type="number"> */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">SKS</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={6}
                  value={addForm.sks}
                  onChange={e => setAddForm(p => ({ ...p, sks: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue"
                  placeholder="Cth: 3"
                />
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
      {/* FIX: No "Selesai" button - changes apply instantly via checkbox onChange */}
      {assigningMatkul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Assign Dosen</h2>
                <p className="text-sm text-gray-500">{assigningMatkul.code} - {assigningMatkul.name}</p>
              </div>
              <button onClick={() => setAssigningMatkul(null)} className="p-1 hover:bg-gray-200 rounded-full"><X size={18} /></button>
            </div>
            <div className="p-4 text-xs text-teal-700 bg-teal-50 border-b border-teal-100 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
              Perubahan tersimpan otomatis saat Anda mencentang/membatalkan pilihan.
            </div>
            <div className="p-6 space-y-2 max-h-80 overflow-y-auto">
              {dosens.map(d => {
                // FIX: Derive isAssigned from `assigningMatkul` state (not matkuls array)
                // so checkbox checked state is immediately in sync after onChange.
                const isAssigned = assigningMatkul.dosens.some(ad => ad.id === d.id);
                return (
                  <label key={d.id} className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-colors ${isAssigned ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{d.name}</p>
                      <p className="text-xs text-gray-500">@{d.username}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      onChange={e => handleAssignDosen(d.id, e.target.checked)}
                      className="w-4 h-4 accent-teal-600"
                    />
                  </label>
                );
              })}
            </div>
            {/* Replaced "Selesai" button with a simple close link */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-right">
              <button onClick={() => setAssigningMatkul(null)} className="text-sm text-gray-500 hover:text-gray-800 font-semibold">Tutup</button>
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
              {/* FIX: Changed from <select> to <input type="number"> in change request modal too */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">SKS Baru (opsional)</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={changeForm.proposedSks}
                  onChange={e => setChangeForm(p => ({ ...p, proposedSks: e.target.value }))}
                  placeholder="Kosongkan jika tidak berubah"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500"
                />
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
