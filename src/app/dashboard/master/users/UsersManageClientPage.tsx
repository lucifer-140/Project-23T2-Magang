"use client";

import { useState, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, X, Search,
  ChevronLeft, ChevronRight, Lock, AlertTriangle, Check
} from 'lucide-react';

type User = { id: string; name: string; username: string; roles: string[] };

const ROLE_OPTIONS = ['MASTER', 'ADMIN', 'KAPRODI', 'KOORDINATOR', 'DOSEN'] as const;
const ALL_ROLES_LABEL = 'SEMUA';
const ITEMS_PER_PAGE = 12;

const ROLE_COLORS: Record<string, string> = {
  MASTER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-uph-blue',
  KAPRODI: 'bg-red-100 text-red-700',
  KOORDINATOR: 'bg-teal-100 text-teal-700',
  DOSEN: 'bg-gray-100 text-gray-700',
};

type Props = { users: User[] };

const EMPTY_ADD = { name: '', username: '', password: '', roles: ['DOSEN'] };
const EMPTY_EDIT = { name: '', username: '', password: '' };

export function UsersManageClientPage({ users: initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form state
  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [addError, setAddError] = useState('');
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [editRoles, setEditRoles] = useState<string[]>([]);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleTab, setActiveRoleTab] = useState(ALL_ROLES_LABEL);
  const [currentPage, setCurrentPage] = useState(1);

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  function handleToggleAddRole(r: string, checked: boolean) {
    if (r === 'DOSEN') return; // Cannot change DOSEN base role
    setAddForm(prev => ({
      ...prev,
      roles: checked ? [...prev.roles, r] : prev.roles.filter(role => role !== r)
    }));
  }

  function handleToggleEditRole(r: string, checked: boolean) {
    if (r === 'DOSEN') return; // Cannot change DOSEN base role
    setEditRoles(prev => 
      checked ? [...prev, r] : prev.filter(role => role !== r)
    );
  }

  // ── ADD USER ──────────────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    setIsSaving(true);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    const data = await res.json();
    if (!res.ok) { setAddError(data.error ?? 'Gagal menambahkan pengguna.'); setIsSaving(false); return; }
    setUsers(prev => [...prev, data]);
    setShowAddModal(false);
    setAddForm(EMPTY_ADD);
    showSuccess(`Pengguna "${data.name}" berhasil ditambahkan.`);
    setIsSaving(false);
  }

  // ── EDIT USER ─────────────────────────────────────────────────────────────
  function startEdit(user: User) {
    setEditingUser(user);
    setEditForm({ name: user.name, username: user.username, password: '' });
    setEditRoles([...user.roles]);
    setEditError('');
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditError('');
    setIsSaving(true);
    
    // First update roles
    const roleRes = await fetch(`/api/users/${editingUser.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: editRoles }),
    });

    if (!roleRes.ok) {
       setEditError('Gagal memperbarui role.'); 
       setIsSaving(false); 
       return; 
    }

    const payload: Record<string, string> = {};
    if (editForm.name && editForm.name !== editingUser.name) payload.name = editForm.name;
    if (editForm.username && editForm.username !== editingUser.username) payload.username = editForm.username;
    if (editForm.password) payload.password = editForm.password;

    let finalData = { ...editingUser, roles: editRoles };

    if (Object.keys(payload).length > 0) {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? 'Gagal memperbarui pengguna.'); setIsSaving(false); return; }
      finalData = { ...finalData, ...data };
    }

    setUsers(prev => prev.map(u => u.id === editingUser.id ? finalData : u));
    setEditingUser(null);
    showSuccess(`Pengguna berhasil diperbarui.`);
    setIsSaving(false);
  }

  // ── DELETE USER ───────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deletingUser) return;
    setIsDeleting(true);
    const res = await fetch(`/api/users/${deletingUser.id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      showSuccess(`Pengguna "${deletingUser.name}" berhasil dihapus.`);
      setDeletingUser(null);
    }
    setIsDeleting(false);
  }

  // ── FILTERING & PAGINATION ────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(u => {
      const matchesRole = activeRoleTab === ALL_ROLES_LABEL || u.roles.includes(activeRoleTab);
      const matchesSearch = u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.roles.join(' ').toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, searchQuery, activeRoleTab]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  function handleSearchChange(q: string) { setSearchQuery(q); setCurrentPage(1); }
  function handleTabChange(tab: string) { setActiveRoleTab(tab); setCurrentPage(1); }

  const roleTabs = [ALL_ROLES_LABEL, ...ROLE_OPTIONS];
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { [ALL_ROLES_LABEL]: users.length };
    ROLE_OPTIONS.forEach(r => { counts[r] = users.filter(u => u.roles.includes(r)).length; });
    return counts;
  }, [users]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Kelola Semua Pengguna</h1>
          <p className="text-gray-500">Master panel - tambah, edit, dan hapus akun di seluruh sistem.</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setAddError(''); }}
          className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
        >
          <Plus size={16} className="mr-2" /> Tambah Pengguna
        </button>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
          <Check size={16} className="text-green-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Role Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {roleTabs.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${activeRoleTab === tab
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-purple-400 hover:text-purple-600'
              }`}
          >
            {tab}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${activeRoleTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
              {roleCounts[tab] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama, username, atau role..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roles</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pagedUsers.length > 0 ? pagedUsers.map(user => {
                const isMaster = user.roles.includes('MASTER');
                const primaryColor = user.roles[0] ? ROLE_COLORS[user.roles[0]] : 'bg-gray-100 text-gray-600';

                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${primaryColor}`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-500 font-mono">@{user.username}</td>
                    <td className="py-3 px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.map(r => (
                          <span key={r} className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${ROLE_COLORS[r] ?? 'bg-gray-100 text-gray-700'}`}>
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEdit(user)}
                          className="inline-flex items-center px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                          title="Edit pengguna"
                        >
                          <Edit2 size={12} className="mr-1" /> Edit
                        </button>
                        {isMaster ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 text-purple-300 text-xs font-bold rounded-lg cursor-not-allowed" title="Akun Master tidak dapat dihapus">
                            <Lock size={11} />
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="inline-flex items-center px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors"
                            title="Hapus pengguna"
                          >
                            <Trash2 size={12} className="mr-1" /> Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filteredUsers.length)} dari {filteredUsers.length} pengguna
            </span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setCurrentPage(n)} className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors ${n === safePage ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL: ADD USER ──────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-purple-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Tambah Pengguna Baru</h2>
                <p className="text-sm text-purple-600">Buat akun baru di sistem</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-purple-100 rounded-full"><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {addError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle size={14} className="flex-shrink-0" /> {addError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input required value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Cth: Dr. Budi Santoso" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Username</label>
                <input required value={addForm.username} onChange={e => setAddForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="Cth: budisantoso" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Password</label>
                <input required type="password" value={addForm.password} onChange={e => setAddForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 6 karakter" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pilih Roles</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-3 p-2.5 rounded-xl border bg-gray-50 border-gray-200 cursor-not-allowed opacity-80">
                    <input type="checkbox" checked={true} readOnly disabled className="accent-purple-600 cursor-not-allowed" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${ROLE_COLORS['DOSEN']}`}>DOSEN</span>
                  </label>
                  {ROLE_OPTIONS.filter(r => r !== 'DOSEN').map(r => (
                    <label key={r} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-colors ${addForm.roles.includes(r) ? 'bg-purple-50 border-purple-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={addForm.roles.includes(r)} onChange={(e) => handleToggleAddRole(r, e.target.checked)} className="accent-purple-600" />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${ROLE_COLORS[r]}`}>{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  {isSaving ? 'Menyimpan...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT USER ─────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Edit Pengguna</h2>
                <p className="text-sm text-gray-500">{editingUser.name} (@{editingUser.username})</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-gray-200 rounded-full"><X size={18} /></button>
            </div>
            <form onSubmit={handleEdit} className="p-6 space-y-4">
              {editError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle size={14} className="flex-shrink-0" /> {editError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={editingUser.name} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Username</label>
                <input value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                  placeholder={editingUser.username} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Password Baru <span className="text-gray-400 normal-case font-medium">(kosongkan jika tidak diubah)</span></label>
                <input type="password" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Edit Roles</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-3 p-2.5 rounded-xl border bg-gray-50 border-gray-200 cursor-not-allowed opacity-80">
                    <input type="checkbox" checked={true} readOnly disabled className="accent-uph-blue cursor-not-allowed" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${ROLE_COLORS['DOSEN']}`}>DOSEN</span>
                  </label>
                  {ROLE_OPTIONS.filter(r => r !== 'DOSEN').map(r => (
                    <label key={r} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-colors ${editRoles.includes(r) ? 'bg-uph-blue/10 border-uph-blue' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={editRoles.includes(r)} onChange={(e) => handleToggleEditRole(r, e.target.checked)} className="accent-uph-blue" />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${ROLE_COLORS[r]}`}>{r}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-uph-blue text-white text-sm font-bold rounded-lg hover:bg-[#111c33] disabled:opacity-50">
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CONFIRMATION ───────────────────────────────────── */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Hapus Pengguna?</h2>
                <p className="text-sm text-red-600 font-medium">Tindakan ini tidak dapat dibatalkan</p>
              </div>
              <button onClick={() => setDeletingUser(null)} className="p-1 hover:bg-red-100 rounded-full"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-5">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-800">{deletingUser.name}</p>
                  <p className="text-xs text-gray-500">@{deletingUser.username} · {deletingUser.roles[0]}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                Akun ini akan dihapus permanen dari sistem. Data RPS yang terkait mungkin terpengaruh.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeletingUser(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-2.5 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
