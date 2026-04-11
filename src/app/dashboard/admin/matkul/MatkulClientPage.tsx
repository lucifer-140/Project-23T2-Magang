"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Users, AlertTriangle, X, Trash2, Search, GraduationCap, ChevronDown, UserCog } from 'lucide-react';

// Hardcoded catalog for the "Tambah Matkul" combobox
const MATKUL_CATALOG = [
  { code: 'CS101', name: 'Algoritma & Pemrograman' },
  { code: 'CS202', name: 'Struktur Data' },
  { code: 'CS301', name: 'Basis Data' },
  { code: 'CS405', name: 'Rekayasa Perangkat Lunak' },
  { code: 'CS410', name: 'Keamanan Informasi' },
];

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

// ─── Combobox component for catalog selection ───────────────────────────────
function MatkulCombobox({
  value, onChange,
}: {
  value: { code: string; name: string };
  onChange: (v: { code: string; name: string }) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() =>
    MATKUL_CATALOG.filter(
      m =>
        m.code.toLowerCase().includes(query.toLowerCase()) ||
        m.name.toLowerCase().includes(query.toLowerCase())
    ), [query]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function select(item: { code: string; name: string }) {
    onChange(item);
    setQuery(`${item.code} – ${item.name}`);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue"
          placeholder="Cari kode atau nama matkul..."
          value={query}
          onFocus={() => setOpen(true)}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
            // Allow free-form: split on " – " if user typed
            const parts = e.target.value.split(' – ');
            onChange({ code: parts[0]?.trim() ?? '', name: parts[1]?.trim() ?? '' });
          }}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {filtered.map(item => (
            <li
              key={item.code}
              onMouseDown={() => select(item)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-uph-blue/5 cursor-pointer"
            >
              <span className="text-[11px] font-bold bg-uph-blue/10 text-uph-blue px-2 py-0.5 rounded uppercase">{item.code}</span>
              <span className="text-sm text-gray-700">{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main page component ─────────────────────────────────────────────────────
export function MatkulClientPage({ matkuls: initialMatkuls, dosens, koordinators }: Props) {
  const [matkuls, setMatkuls] = useState(initialMatkuls);

  // Modal: Add Matkul
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ code: '', name: '', sks: '3' });

  // Modal: Unified Role Assignment (replaces separate +Koor / +Dosen modals)
  const [assigningMatkul, setAssigningMatkul] = useState<Matkul | null>(null);
  const [assignTab, setAssignTab] = useState<'koordinator' | 'dosen'>('koordinator');
  const [assignSearch, setAssignSearch] = useState('');

  // Modal: Confirm remove-dosen (deep cleanup warning)
  const [removingDosen, setRemovingDosen] = useState<{ dosenId: string; dosenName: string } | null>(null);

  // Modal: Request Change
  const [changingMatkul, setChangingMatkul] = useState<Matkul | null>(null);
  const [changeForm, setChangeForm] = useState({ proposedName: '', proposedCode: '', proposedSks: '', reason: '' });

  // Modal: Delete Matkul
  const [deletingMatkul, setDeletingMatkul] = useState<Matkul | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered lists for assignment modal
  const filteredAssignList = useMemo(() => {
    const q = assignSearch.toLowerCase();
    if (assignTab === 'koordinator')
      return koordinators.filter(k => k.name.toLowerCase().includes(q) || k.email.toLowerCase().includes(q));
    return dosens.filter(d => d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q));
  }, [assignTab, assignSearch, dosens, koordinators]);

  function openAssignModal(matkul: Matkul, tab: 'koordinator' | 'dosen' = 'koordinator') {
    setAssigningMatkul(matkul);
    setAssignTab(tab);
    setAssignSearch('');
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleAddMatkul(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/matkul', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    if (res.ok) {
      const data = await res.json();
      setMatkuls(prev => [...prev, { ...data, dosens: [], koordinators: [] }]);
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
      alert('Gagal menghapus matkul.');
    }
    setIsDeleting(false);
  }

  async function handleAssignKoordinator(koordinatorId: string, checked: boolean) {
    if (!assigningMatkul) return;
    const matkulId = assigningMatkul.id;
    const updatedKoordinators = checked
      ? [...assigningMatkul.koordinators, koordinators.find(k => k.id === koordinatorId)!]
      : assigningMatkul.koordinators.filter(k => k.id !== koordinatorId);

    const updated = { ...assigningMatkul, koordinators: updatedKoordinators };
    setAssigningMatkul(updated);
    setMatkuls(prev => prev.map(m => m.id === matkulId ? updated : m));

    await fetch(`/api/matkul/${matkulId}/assign-coordinator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ koordinatorId, action: checked ? 'add' : 'remove' }),
    });
  }

  // Attempt to uncheck dosen → show confirmation modal first
  function requestRemoveDosen(dosenId: string, dosenName: string) {
    setRemovingDosen({ dosenId, dosenName });
  }

  async function confirmRemoveDosen() {
    if (!assigningMatkul || !removingDosen) return;
    const matkulId = assigningMatkul.id;
    const { dosenId } = removingDosen;

    const updatedDosens = assigningMatkul.dosens.filter(d => d.id !== dosenId);
    const updated = { ...assigningMatkul, dosens: updatedDosens };
    setAssigningMatkul(updated);
    setMatkuls(prev => prev.map(m => m.id === matkulId ? updated : m));
    setRemovingDosen(null);

    await fetch(`/api/matkul/${matkulId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dosenId, action: 'remove' }),
    });
  }

  async function handleAssignDosen(dosenId: string, checked: boolean) {
    if (!assigningMatkul) return;
    if (!checked) {
      const dosen = dosens.find(d => d.id === dosenId);
      requestRemoveDosen(dosenId, dosen?.name ?? dosenId);
      return;
    }
    const matkulId = assigningMatkul.id;
    const updatedDosens = [...assigningMatkul.dosens, dosens.find(d => d.id === dosenId)!];
    const updated = { ...assigningMatkul, dosens: updatedDosens };
    setAssigningMatkul(updated);
    setMatkuls(prev => prev.map(m => m.id === matkulId ? updated : m));

    await fetch(`/api/matkul/${matkulId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dosenId, action: 'add' }),
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

  // ── Render ─────────────────────────────────────────────────────────────────
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
          <strong>Perhatian:</strong> Mengedit data matkul (nama, kode, SKS) akan mengirim permintaan ke <strong>Kaprodi</strong> untuk disetujui. Penghapusan matkul dan assignment bersifat final dan <strong>menghapus data RPS terkait</strong>.
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
                      {m.koordinators?.length === 0
                        ? <span className="text-xs text-gray-400 italic">Belum assign</span>
                        : m.koordinators?.map(k => (
                          <span key={k.id} className="text-[11px] bg-uph-blue text-white px-2 py-0.5 rounded-full font-medium">{k.name}</span>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">DOSEN:</span>
                      {m.dosens?.length === 0
                        ? <span className="text-xs text-gray-400 italic">Belum assign</span>
                        : m.dosens?.map(d => (
                          <span key={d.id} className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium border border-teal-100">{d.name}</span>
                        ))}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col items-center gap-1.5">
                    {/* Single unified "Assign Roles" button */}
                    <button
                      onClick={() => openAssignModal(m)}
                      className="inline-flex items-center px-2.5 py-1.5 bg-uph-blue/5 hover:bg-uph-blue/10 text-uph-blue text-[11px] font-bold rounded transition-colors w-full justify-center"
                      title="Assign Koordinator & Dosen"
                    >
                      <UserCog size={13} className="mr-1" /> Assign Roles
                    </button>
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

      {/* ── Modal: Delete Matkul Confirm ────────────────────────────────────── */}
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
                  {isDeleting ? 'Menghapus...' : 'Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add Matkul (with catalog combobox) ───────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Tambah Mata Kuliah Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddMatkul} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Pilih dari Katalog</label>
                <MatkulCombobox
                  value={{ code: addForm.code, name: addForm.name }}
                  onChange={({ code, name }) => setAddForm(p => ({ ...p, code, name }))}
                />
                <p className="text-[11px] text-gray-400 mt-1">Cari berdasarkan kode atau nama mata kuliah.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Kode</label>
                  <input required value={addForm.code} onChange={e => setAddForm(p => ({ ...p, code: e.target.value }))}
                    placeholder="CS101" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">SKS</label>
                  <input type="number" required min={1} max={6} value={addForm.sks} onChange={e => setAddForm(p => ({ ...p, sks: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue" placeholder="3" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nama Mata Kuliah</label>
                <input required value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Cth: Algoritma & Pemrograman" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-uph-blue text-white text-sm font-bold rounded-lg hover:bg-[#111c33]">Tambahkan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Unified Role Assignment ──────────────────────────────────── */}
      {assigningMatkul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <UserCog size={18} className="text-uph-blue" /> Assign Roles
                </h2>
                <p className="text-sm text-gray-500">{assigningMatkul.code} – {assigningMatkul.name}</p>
              </div>
              <button onClick={() => setAssigningMatkul(null)} className="p-1 hover:bg-gray-200 rounded-full"><X size={18} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => { setAssignTab('koordinator'); setAssignSearch(''); }}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${assignTab === 'koordinator' ? 'border-b-2 border-uph-blue text-uph-blue bg-uph-blue/5' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <GraduationCap size={15} /> Koordinator ({assigningMatkul.koordinators.length})
              </button>
              <button
                onClick={() => { setAssignTab('dosen'); setAssignSearch(''); }}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${assignTab === 'dosen' ? 'border-b-2 border-teal-600 text-teal-700 bg-teal-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Users size={15} /> Dosen ({assigningMatkul.dosens.length})
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder={assignTab === 'koordinator' ? 'Cari koordinator...' : 'Cari dosen...'}
                  value={assignSearch}
                  onChange={e => setAssignSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-uph-blue"
                />
              </div>
            </div>

            {/* Tab hint */}
            {assignTab === 'dosen' && (
              <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
                <p className="text-[11px] text-amber-700">Menghapus dosen akan <strong>menghapus seluruh data RPS</strong> milik dosen tersebut pada matkul ini.</p>
              </div>
            )}

            {/* List */}
            <div className="p-4 space-y-2 overflow-y-auto flex-1">
              {filteredAssignList.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">Tidak ada hasil.</p>
              )}

              {assignTab === 'koordinator' && filteredAssignList.map(k => {
                const isAssigned = assigningMatkul.koordinators.some(a => a.id === k.id);
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

              {assignTab === 'dosen' && filteredAssignList.map(d => {
                const isAssigned = assigningMatkul.dosens.some(a => a.id === d.id);
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

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setAssigningMatkul(null)}
                className="w-full py-2.5 bg-uph-blue text-white text-sm font-bold rounded-lg hover:bg-[#111c33]"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Remove Dosen (deep cleanup warning) ──────────────── */}
      {removingDosen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100 flex justify-between items-center bg-red-50">
              <div>
                <h2 className="text-base font-bold text-gray-800">Hapus Dosen dari Matkul?</h2>
                <p className="text-xs text-red-600 font-semibold">Tindakan ini tidak dapat diurungkan</p>
              </div>
              <button onClick={() => setRemovingDosen(null)} className="p-1 hover:bg-red-100 rounded-full"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  Menghapus <strong>{removingDosen.dosenName}</strong> dari matkul ini akan secara permanen{' '}
                  <strong>menghapus semua data RPS</strong> milik dosen tersebut pada mata kuliah ini, termasuk file yang diunggah dan riwayat persetujuan.
                </p>
              </div>
              <p className="text-sm text-gray-600">Lanjutkan hanya jika Anda yakin data tersebut tidak diperlukan lagi.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRemovingDosen(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={confirmRemoveDosen}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700"
                >
                  Hapus & Bersihkan Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Request Change ────────────────────────────────────────────── */}
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
