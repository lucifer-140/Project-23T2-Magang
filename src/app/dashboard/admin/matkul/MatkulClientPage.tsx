"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Edit2, Users, AlertTriangle, X, Trash2, Search,
  GraduationCap, ChevronDown, UserCog, Tag, ArrowLeft,
} from 'lucide-react';

const MATKUL_CATALOG = [
  { code: 'CS101', name: 'Algoritma & Pemrograman' },
  { code: 'CS202', name: 'Struktur Data' },
  { code: 'CS301', name: 'Basis Data' },
  { code: 'CS405', name: 'Rekayasa Perangkat Lunak' },
  { code: 'CS410', name: 'Keamanan Informasi' },
];

type DosenRef = { id: string; name: string; email: string };
type MatkulClassData = { id: string; name: string; dosens: DosenRef[] };
type SemesterData = {
  id: string;
  nama: string;
  isActive: boolean;
  tahunAkademik: { id: string; tahun: string };
};
type Matkul = {
  id: string; code: string; name: string; sks: number;
  semesterId: string | null;
  semester: SemesterData | null;
  dosens: DosenRef[];
  koordinators: DosenRef[];
  classes: MatkulClassData[];
};

type Props = {
  semester: SemesterData;
  matkuls: Matkul[];
  dosens: DosenRef[];
  koordinators: DosenRef[];
};

// ─── Combobox ─────────────────────────────────────────────────────────────────
function MatkulCombobox({
  value, onChange, onCatalogSelect,
}: {
  value: { code: string; name: string };
  onChange: (v: { code: string; name: string }) => void;
  onCatalogSelect?: (selected: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayValue = focused ? query : (value.code ? `${value.code} - ${value.name}` : '');
  const filtered = useMemo(() =>
    MATKUL_CATALOG.filter(m =>
      m.code.toLowerCase().includes(query.toLowerCase()) ||
      m.name.toLowerCase().includes(query.toLowerCase())
    ), [query]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setFocused(false); setQuery('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function select(item: { code: string; name: string }) {
    onChange(item); onCatalogSelect?.(true);
    setQuery(''); setOpen(false); setFocused(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
        <input
          className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue"
          placeholder="Cari kode atau nama matkul..."
          value={displayValue}
          onFocus={() => { setFocused(true); setQuery(''); setOpen(true); }}
          onChange={e => {
            setQuery(e.target.value); setOpen(true); onCatalogSelect?.(false);
            const parts = e.target.value.split(' - ');
            onChange({ code: parts[0]?.trim() ?? '', name: parts[1]?.trim() ?? '' });
          }}
        />
        <button type="button"
          onMouseDown={e => { e.preventDefault(); if (!focused) { setFocused(true); setQuery(''); } setOpen(o => !o); }}
          className="absolute right-3 top-1/2 -translate-y-1/2">
          <ChevronDown className="text-gray-400" size={14} />
        </button>
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {filtered.map(item => (
            <li key={item.code} onMouseDown={() => select(item)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-uph-blue/5 cursor-pointer">
              <span className="text-[11px] font-bold bg-uph-blue/10 text-uph-blue px-2 py-0.5 rounded uppercase">{item.code}</span>
              <span className="text-sm text-gray-700">{item.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Per-dosen class selector dropdown ───────────────────────────────────────
function DosenClassPicker({
  dosen, assignedClasses, allClasses, onAdd, onRemove,
}: {
  dosen: DosenRef;
  assignedClasses: MatkulClassData[];
  allClasses: MatkulClassData[];
  onAdd: (classId: string) => void;
  onRemove: (classId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unassignedClasses = allClasses.filter(c => !assignedClasses.some(a => a.id === c.id));

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border bg-white border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-gray-800">{dosen.name}</p>
        <p className="text-xs text-gray-500">{dosen.email}</p>
        {/* Assigned class chips */}
        {assignedClasses.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {assignedClasses.map(cls => (
              <span key={cls.id}
                className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[11px] font-bold px-2 py-0.5 rounded-full">
                <Tag size={9} /> {cls.name}
                <button type="button" onClick={() => onRemove(cls.id)}
                  className="hover:text-red-500 transition-colors ml-0.5"><X size={9} /></button>
              </span>
            ))}
          </div>
        )}
        {assignedClasses.length === 0 && (
          <p className="text-[11px] text-gray-400 mt-1 italic">Belum ada kelas</p>
        )}
      </div>

      {/* Add to class dropdown */}
      {allClasses.length > 0 && (
        <div ref={ref} className="relative ml-3 flex-shrink-0">
          <button type="button" onClick={() => setOpen(o => !o)}
            disabled={unassignedClasses.length === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Plus size={12} /> Kelas
          </button>
          {open && unassignedClasses.length > 0 && (
            <ul className="absolute right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[100px]">
              {unassignedClasses.map(cls => (
                <li key={cls.id}
                  onMouseDown={() => { onAdd(cls.id); setOpen(false); }}
                  className="px-3 py-2 text-sm text-gray-700 hover:bg-teal-50 cursor-pointer font-medium flex items-center gap-1.5">
                  <Tag size={11} className="text-indigo-400" /> {cls.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function MatkulClientPage({ semester, matkuls: initialMatkuls, dosens, koordinators }: Props) {
  const router = useRouter();
  const [matkuls, setMatkuls] = useState(initialMatkuls);

  // Add modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    code: '', name: '', sks: '3',
  });
  const [catalogSelected, setCatalogSelected] = useState(false);
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Assign modal
  const [assigningMatkul, setAssigningMatkul] = useState<Matkul | null>(null);
  const [assignTab, setAssignTab] = useState<'koordinator' | 'dosen'>('koordinator');
  const [assignSearch, setAssignSearch] = useState('');
  const [newClassName, setNewClassName] = useState('');

  // Confirmations
  const [removingKoordinator, setRemovingKoordinator] = useState<{ id: string; name: string } | null>(null);
  const [removingDosen, setRemovingDosen] = useState<{ dosenId: string; dosenName: string; classId: string } | null>(null);

  // Change request
  const [changingMatkul, setChangingMatkul] = useState<Matkul | null>(null);
  const [changeForm, setChangeForm] = useState({ proposedName: '', proposedCode: '', proposedSks: '', reason: '' });

  // Delete
  const [deletingMatkul, setDeletingMatkul] = useState<Matkul | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredKoordinators = useMemo(() => {
    const q = assignSearch.toLowerCase();
    return koordinators.filter(k => k.name.toLowerCase().includes(q) || k.email.toLowerCase().includes(q));
  }, [assignSearch, koordinators]);

  const filteredDosens = useMemo(() => {
    const q = assignSearch.toLowerCase();
    return dosens.filter(d => d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q));
  }, [assignSearch, dosens]);

  // Map: dosenId -> list of classes they're assigned to (in current assigningMatkul)
  const dosenClassMap = useMemo(() => {
    const map = new Map<string, MatkulClassData[]>();
    for (const cls of assigningMatkul?.classes ?? []) {
      for (const d of cls.dosens) {
        if (!map.has(d.id)) map.set(d.id, []);
        map.get(d.id)!.push(cls);
      }
    }
    return map;
  }, [assigningMatkul]);

  function openAssignModal(matkul: Matkul, tab: 'koordinator' | 'dosen' = 'koordinator') {
    setAssigningMatkul(matkul);
    setAssignTab(tab);
    setAssignSearch('');
    setNewClassName('');
  }

  function resetAddForm() {
    setAddForm({ code: '', name: '', sks: '3' });
    setCatalogSelected(false);
    setAddError('');
  }

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function handleAddMatkul(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setIsAdding(true);
    try {
      const res = await fetch('/api/matkul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: addForm.code,
          name: addForm.name,
          sks: addForm.sks,
          semesterId: semester.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? 'Gagal menambahkan matkul.');
        return;
      }
      setMatkuls(prev => [...prev, data]);
      setShowAddModal(false);
      resetAddForm();
    } catch {
      setAddError('Gagal terhubung ke server.');
    } finally {
      setIsAdding(false);
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
    if (!checked) {
      const k = koordinators.find(k => k.id === koordinatorId);
      setRemovingKoordinator({ id: koordinatorId, name: k?.name ?? koordinatorId });
      return;
    }
    const matkulId = assigningMatkul.id;
    const updatedKoordinators = [...assigningMatkul.koordinators, koordinators.find(k => k.id === koordinatorId)!];
    const updated = { ...assigningMatkul, koordinators: updatedKoordinators };
    setAssigningMatkul(updated);
    setMatkuls(prev => prev.map(m => m.id === matkulId ? updated : m));
    await fetch(`/api/matkul/${matkulId}/assign-coordinator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ koordinatorId, action: 'add' }),
    });
  }

  async function confirmRemoveKoordinator() {
    if (!assigningMatkul || !removingKoordinator) return;
    const matkulId = assigningMatkul.id;
    const updatedKoordinators = assigningMatkul.koordinators.filter(k => k.id !== removingKoordinator.id);
    const updated = { ...assigningMatkul, koordinators: updatedKoordinators };
    setAssigningMatkul(updated);
    setMatkuls(prev => prev.map(m => m.id === matkulId ? updated : m));
    setRemovingKoordinator(null);
    await fetch(`/api/matkul/${matkulId}/assign-coordinator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ koordinatorId: removingKoordinator.id, action: 'remove' }),
    });
  }

  async function handleAddClass() {
    if (!assigningMatkul || !newClassName.trim()) return;
    const name = newClassName.trim().toUpperCase();
    const res = await fetch(`/api/matkul/${assigningMatkul.id}/classes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', className: name }),
    });
    if (res.ok) {
      const cls = await res.json();
      const updated = { ...assigningMatkul, classes: [...assigningMatkul.classes, cls] };
      setAssigningMatkul(updated);
      setMatkuls(prev => prev.map(m => m.id === assigningMatkul.id ? updated : m));
      setNewClassName('');
    }
  }

  // Add dosen to a specific class
  async function handleAddDosenToClass(dosenId: string, classId: string) {
    if (!assigningMatkul) return;
    const cls = assigningMatkul.classes.find(c => c.id === classId);
    if (!cls) return;

    const res = await fetch(`/api/matkul/${assigningMatkul.id}/classes/${classId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dosenId, action: 'add' }),
    });
    if (res.ok) {
      const updatedCls = await res.json();
      const newClasses = assigningMatkul.classes.map(c => c.id === classId ? updatedCls : c);
      const allDosens = Array.from(
        new Map(newClasses.flatMap(c => c.dosens).map(d => [d.id, d])).values()
      );
      const updated = { ...assigningMatkul, classes: newClasses, dosens: allDosens };
      setAssigningMatkul(updated);
      setMatkuls(prev => prev.map(m => m.id === assigningMatkul.id ? updated : m));
    }
  }

  // Remove dosen from a specific class (with confirmation)
  function requestRemoveDosenFromClass(dosenId: string, classId: string) {
    const d = dosens.find(d => d.id === dosenId);
    setRemovingDosen({ dosenId, dosenName: d?.name ?? dosenId, classId });
  }

  async function confirmRemoveDosen() {
    if (!assigningMatkul || !removingDosen) return;
    const { dosenId, classId } = removingDosen;

    await fetch(`/api/matkul/${assigningMatkul.id}/classes/${classId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dosenId, action: 'remove' }),
    });

    const newClasses = assigningMatkul.classes.map(c =>
      c.id === classId ? { ...c, dosens: c.dosens.filter(d => d.id !== dosenId) } : c
    );
    const allDosens = Array.from(
      new Map(newClasses.flatMap(c => c.dosens).map(d => [d.id, d])).values()
    );
    const updated = { ...assigningMatkul, classes: newClasses, dosens: allDosens };
    setAssigningMatkul(updated);
    setMatkuls(prev => prev.map(m => m.id === assigningMatkul.id ? updated : m));
    setRemovingDosen(null);
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

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center gap-2 mb-1 text-sm text-gray-500">
        <button onClick={() => router.push('/dashboard/admin/matkul')}
          className="hover:text-uph-blue transition-colors font-medium">
          <ArrowLeft size={15} className="inline mr-1" />Semua Tahun
        </button>
        <span>/</span>
        <button onClick={() => router.push(`/dashboard/admin/matkul/${semester.tahunAkademik.id}`)}
          className="hover:text-uph-blue transition-colors font-medium">
          TA {semester.tahunAkademik.tahun}
        </button>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Semester {semester.nama}</h1>
          <p className="text-gray-500">TA {semester.tahunAkademik.tahun} — Tambah matkul, kelola kelas, assign koordinator dan dosen.</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-uph-blue hover:bg-[#111c33] text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
          <Plus size={16} className="mr-2" /> Tambah Matkul
        </button>
      </div>

      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
        <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-yellow-800">
          <strong>Perhatian:</strong> Mengedit data matkul akan mengirim permintaan ke <strong>Kaprodi</strong> untuk disetujui. Penghapusan matkul bersifat final dan <strong>menghapus semua data terkait</strong>.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kode</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Mata Kuliah</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">SKS</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Kelas</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Koordinator & Dosen</th>
              <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {matkuls.map(m => (
              <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-6">
                  <span className="inline-block bg-uph-blue/10 text-uph-blue text-xs font-bold px-2 py-1 rounded uppercase">{m.code}</span>
                </td>
                <td className="py-4 px-6 font-semibold text-gray-800">{m.name}</td>
                <td className="py-4 px-6 text-center">
                  <span className="inline-block bg-gray-100 text-gray-700 text-xs font-bold px-3 py-1 rounded-full">{m.sks} SKS</span>
                </td>
                <td className="py-4 px-6">
                  {m.classes.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {m.classes.map(c => (
                        <span key={c.id} className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                          {c.name}{c.dosens.length > 0 && <span className="ml-1 opacity-60">({c.dosens.length})</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Belum ada kelas</span>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">KOORD:</span>
                      {m.koordinators.length === 0
                        ? <span className="text-xs text-gray-400 italic">Belum assign</span>
                        : m.koordinators.map(k => (
                          <span key={k.id} className="text-[11px] bg-uph-blue text-white px-2 py-0.5 rounded-full font-medium">{k.name}</span>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">DOSEN:</span>
                      {m.dosens.length === 0
                        ? <span className="text-xs text-gray-400 italic">Belum assign</span>
                        : m.dosens.map(d => (
                          <span key={d.id} className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium border border-teal-100">{d.name}</span>
                        ))}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col items-center gap-1.5">
                    <button onClick={() => openAssignModal(m)}
                      className="inline-flex items-center px-2.5 py-1.5 bg-uph-blue/5 hover:bg-uph-blue/10 text-uph-blue text-[11px] font-bold rounded transition-colors w-full justify-center">
                      <UserCog size={13} className="mr-1" /> Assign Roles
                    </button>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setChangingMatkul(m);
                          setChangeForm({ proposedName: m.name, proposedCode: m.code, proposedSks: String(m.sks), reason: '' });
                        }}
                        className="inline-flex items-center px-2 py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 text-[11px] font-bold rounded transition-colors">
                        <Edit2 size={13} /> Edit Data
                      </button>
                      <button onClick={() => setDeletingMatkul(m)}
                        className="inline-flex items-center px-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded transition-colors">
                        <Trash2 size={13} /> Hapus
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {matkuls.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Belum ada mata kuliah.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal: Add Matkul ─────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-800">Tambah Mata Kuliah Baru</h2>
              <button onClick={() => { setShowAddModal(false); resetAddForm(); }} className="p-1 hover:bg-gray-200 rounded-full"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddMatkul} className="p-6 space-y-4 overflow-y-auto flex-1">

              {addError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{addError}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Pilih dari Katalog</label>
                <MatkulCombobox
                  value={{ code: addForm.code, name: addForm.name }}
                  onChange={({ code, name }) => setAddForm(p => ({ ...p, code, name }))}
                  onCatalogSelect={setCatalogSelected}
                />
                <p className="text-[11px] text-gray-400 mt-1">Atau isi manual di bawah.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Kode *</label>
                  <input required value={addForm.code} readOnly={catalogSelected}
                    onChange={catalogSelected ? undefined : e => setAddForm(p => ({ ...p, code: e.target.value }))}
                    placeholder="CS101"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none ${catalogSelected ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-200 focus:border-uph-blue'}`} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">SKS *</label>
                  <input type="number" required min={1} max={6} value={addForm.sks} readOnly={catalogSelected}
                    onChange={catalogSelected ? undefined : e => setAddForm(p => ({ ...p, sks: e.target.value }))}
                    placeholder="3"
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none ${catalogSelected ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-200 focus:border-uph-blue'}`} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nama Mata Kuliah *</label>
                <input required value={addForm.name} readOnly={catalogSelected}
                  onChange={catalogSelected ? undefined : e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Cth: Algoritma & Pemrograman"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none ${catalogSelected ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-200 focus:border-uph-blue'}`} />
              </div>

              <div className="p-3 bg-uph-blue/5 rounded-lg border border-uph-blue/10 text-sm text-uph-blue font-medium">
                Semester {semester.nama} · TA {semester.tahunAkademik.tahun}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAddModal(false); resetAddForm(); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={isAdding}
                  className="flex-1 py-2.5 bg-uph-blue text-white text-sm font-bold rounded-lg hover:bg-[#111c33] disabled:opacity-60">
                  {isAdding ? 'Menyimpan...' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Assign Roles ────────────────────────────────────────────────── */}
      {assigningMatkul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <UserCog size={18} className="text-uph-blue" /> Assign Roles
                </h2>
                <p className="text-sm text-gray-500">{assigningMatkul.code} - {assigningMatkul.name}</p>
              </div>
              <button onClick={() => setAssigningMatkul(null)} className="p-1 hover:bg-gray-200 rounded-full"><X size={18} /></button>
            </div>

            <div className="flex border-b border-gray-100">
              <button onClick={() => { setAssignTab('koordinator'); setAssignSearch(''); }}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${assignTab === 'koordinator' ? 'border-b-2 border-uph-blue text-uph-blue bg-uph-blue/5' : 'text-gray-500 hover:bg-gray-50'}`}>
                <GraduationCap size={15} /> Koordinator ({assigningMatkul.koordinators.length})
              </button>
              <button onClick={() => { setAssignTab('dosen'); setAssignSearch(''); }}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${assignTab === 'dosen' ? 'border-b-2 border-teal-600 text-teal-700 bg-teal-50/50' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Users size={15} /> Dosen ({assigningMatkul.dosens.length})
              </button>
            </div>

            <div className="px-6 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="text"
                  placeholder={assignTab === 'koordinator' ? 'Cari koordinator...' : 'Cari dosen...'}
                  value={assignSearch}
                  onChange={e => setAssignSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-uph-blue" />
              </div>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">

              {/* Koordinator tab */}
              {assignTab === 'koordinator' && (
                <>
                  {filteredKoordinators.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">Tidak ada koordinator.</p>
                  )}
                  {filteredKoordinators.map(k => {
                    const isAssigned = assigningMatkul.koordinators.some(a => a.id === k.id);
                    return (
                      <label key={k.id}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-colors ${isAssigned ? 'bg-uph-blue/10 border-uph-blue' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{k.name}</p>
                          <p className="text-xs text-gray-500">{k.email}</p>
                        </div>
                        <input type="checkbox" checked={isAssigned}
                          onChange={e => handleAssignKoordinator(k.id, e.target.checked)}
                          className="w-4 h-4 accent-uph-blue" />
                      </label>
                    );
                  })}
                </>
              )}

              {/* Dosen tab: dosen-first, assign to class via dropdown */}
              {assignTab === 'dosen' && (
                <>
                  {/* Manage classes row */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Tag size={12} /> Kelola Kelas
                    </p>
                    <div className="flex gap-2 mb-2">
                      <input value={newClassName} onChange={e => setNewClassName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddClass(); } }}
                        placeholder="Tambah kelas, cth: 23TI1"
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue bg-white" />
                      <button type="button" onClick={handleAddClass}
                        className="px-3 py-2 bg-uph-blue text-white text-sm font-bold rounded-lg hover:bg-[#111c33]">
                        <Plus size={14} />
                      </button>
                    </div>
                    {assigningMatkul.classes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {assigningMatkul.classes.map(cls => (
                          <span key={cls.id}
                            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold px-2.5 py-1 rounded-full">
                            <Tag size={10} /> {cls.name}
                            <button type="button"
                              onClick={async () => {
                                if (!confirm(`Hapus kelas "${cls.name}"?`)) return;
                                const res = await fetch(`/api/matkul/${assigningMatkul.id}/classes`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'remove', className: cls.name }),
                                });
                                if (res.ok) {
                                  const updated = { ...assigningMatkul, classes: assigningMatkul.classes.filter(c => c.id !== cls.id) };
                                  setAssigningMatkul(updated);
                                  setMatkuls(prev => prev.map(m => m.id === assigningMatkul.id ? updated : m));
                                }
                              }}
                              className="hover:text-red-500 transition-colors ml-0.5"><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    {assigningMatkul.classes.length === 0 && (
                      <p className="text-xs text-gray-400 italic">Belum ada kelas.</p>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-1" />

                  {/* Dosen list */}
                  {filteredDosens.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-2">Tidak ada dosen.</p>
                  )}
                  {assigningMatkul.classes.length === 0 && filteredDosens.length > 0 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-amber-700">Tambahkan kelas terlebih dahulu sebelum assign dosen.</p>
                    </div>
                  )}
                  {filteredDosens.map(d => (
                    <DosenClassPicker
                      key={d.id}
                      dosen={d}
                      assignedClasses={dosenClassMap.get(d.id) ?? []}
                      allClasses={assigningMatkul.classes}
                      onAdd={classId => handleAddDosenToClass(d.id, classId)}
                      onRemove={classId => requestRemoveDosenFromClass(d.id, classId)}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Remove Koordinator ───────────────────────────────────────── */}
      {removingKoordinator && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-800">Hapus Koordinator?</h2>
              <button onClick={() => setRemovingKoordinator(null)} className="p-1 hover:bg-red-100 rounded-full"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                Hapus <strong>{removingKoordinator.name}</strong> sebagai koordinator dari matkul ini?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setRemovingKoordinator(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button onClick={confirmRemoveKoordinator}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700">Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Remove Dosen from Class ─────────────────────────────────── */}
      {removingDosen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-800">Hapus dari Kelas?</h2>
              <button onClick={() => setRemovingDosen(null)} className="p-1 hover:bg-red-100 rounded-full"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">
                Hapus <strong>{removingDosen.dosenName}</strong> dari kelas{' '}
                <strong>{assigningMatkul?.classes.find(c => c.id === removingDosen.classId)?.name}</strong>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setRemovingDosen(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button onClick={confirmRemoveDosen}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700">Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Matkul ─────────────────────────────────────────────────────── */}
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
                Hapus matkul <strong>{deletingMatkul.code} - {deletingMatkul.name}</strong> secara permanen? Semua data terkait akan terhapus.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingMatkul(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button onClick={handleDeleteMatkul} disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {isDeleting ? 'Menghapus...' : 'Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Request Change ────────────────────────────────────────────────────── */}
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
                <input type="number" min={1} max={6} value={changeForm.proposedSks}
                  onChange={e => setChangeForm(p => ({ ...p, proposedSks: e.target.value }))}
                  placeholder="Kosongkan jika tidak berubah"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Alasan Perubahan *</label>
                <textarea required value={changeForm.reason}
                  onChange={e => setChangeForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500 min-h-[80px] resize-none"
                  placeholder="Jelaskan alasan perubahan ini..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setChangingMatkul(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-yellow-500 text-white text-sm font-bold rounded-lg hover:bg-yellow-600">Kirim Permintaan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
