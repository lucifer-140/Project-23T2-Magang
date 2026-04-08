"use client";

import { useState, useMemo } from 'react';
import { Users, Edit2, X, Search, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

type User = {
  id: string; name: string; username: string;
  roles: string[];
};

const ALL_ROLES_LABEL = 'SEMUA';
// Only roles that an Admin can realistically see/filter by
const ROLE_OPTIONS = ['ADMIN', 'KAPRODI', 'KOORDINATOR', 'DOSEN'] as const;

// Roles that an Admin can assign to someone else
const ASSIGNABLE_ROLES = ['KAPRODI', 'KOORDINATOR'];

const ROLE_COLORS: Record<string, string> = {
  MASTER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-uph-blue/10 text-uph-blue',
  KAPRODI: 'bg-red-100 text-red-700',
  KOORDINATOR: 'bg-teal-100 text-teal-700',
  DOSEN: 'bg-gray-100 text-gray-700',
};

const ITEMS_PER_PAGE = 10;

type Props = { users: User[]; allMatkuls: { id: string; code: string; name: string }[] };

export function UsersClientPage({ users: initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Now tracks an array of strings
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoleTab, setActiveRoleTab] = useState<string>(ALL_ROLES_LABEL);
  const [currentPage, setCurrentPage] = useState(1);

  function startEdit(user: User) {
    setEditingUser(user);
    setEditRoles([...user.roles]);
  }

  function handleToggleEditRole(r: string, checked: boolean) {
    if (r === 'DOSEN') return; // Cannot change DOSEN base role
    setEditRoles(prev => 
      checked ? [...prev, r] : prev.filter(role => role !== r)
    );
  }

  async function handleSaveRole(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);

    const res = await fetch(`/api/users/${editingUser.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: editRoles }),
    });

    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, roles: editRoles } : u));
      setEditingUser(null);
    } else {
      alert('Gagal menyimpan role. Pastikan Anda memiliki izin.');
    }
    setIsSaving(false);
  }

  // Filtered + paginated data derived from state
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

  // When filter changes, reset to page 1
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
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Kelola Pengguna</h1>
        <p className="text-gray-500">Lihat semua akun dan ubah peran (roles) akademis pengguna di sistem.</p>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {roleTabs.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${activeRoleTab === tab
                ? 'bg-uph-blue text-white border-uph-blue shadow-sm'
                : 'bg-white text-gray-500 border-gray-200 hover:border-uph-blue hover:text-uph-blue'
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

      {/* Data Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama, username, atau role..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue"
            />
          </div>
        </div>

        {/* Table */}
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
                const isAdmin = user.roles.includes('ADMIN');
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
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed" title="Role Admin tidak dapat diubah">
                          <Lock size={11} /> Terlindungi
                        </span>
                      ) : (
                        <button
                          onClick={() => startEdit(user)}
                          className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors"
                        >
                          <Edit2 size={12} className="mr-1.5" /> Ubah Role
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Tidak ada pengguna ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Menampilkan {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filteredUsers.length)} dari {filteredUsers.length} pengguna
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold border transition-colors ${n === safePage
                      ? 'bg-uph-blue text-white border-uph-blue'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-uph-blue'
                    }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Edit Role */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Ubah Role Akademis</h2>
                <p className="text-sm text-gray-500">{editingUser.name} (@{editingUser.username})</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-gray-200 rounded-full"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveRole} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Pilih Role</label>
                <div className="grid grid-cols-1 gap-2">
                  
                  {/* Basic DOSEN Role (Immutable) */}
                  <label className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50 border-gray-200 cursor-not-allowed opacity-80">
                    <input type="checkbox" checked={true} readOnly disabled className="accent-uph-blue w-4 h-4 cursor-not-allowed" />
                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${ROLE_COLORS['DOSEN']}`}>DOSEN</span>
                    <span className="ml-auto text-[10px] text-gray-500 font-medium italic">Base Role</span>
                  </label>

                  {ASSIGNABLE_ROLES.map(r => {
                    const isChecked = editRoles.includes(r);
                    return (
                      <label
                        key={r}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${isChecked
                              ? 'bg-uph-blue/10 border-uph-blue cursor-pointer'
                              : 'bg-white border-gray-200 hover:bg-gray-50 cursor-pointer'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleEditRole(r, e.target.checked)}
                          className="accent-uph-blue w-4 h-4"
                        />
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${ROLE_COLORS[r]}`}>{r}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 bg-uph-blue text-white text-sm font-bold rounded-lg hover:bg-[#111c33] disabled:opacity-50">
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
