"use client";

import { useState } from 'react';
import { UserCheck, UserX, Clock, X, Search, CheckCircle } from 'lucide-react';

type PendingUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
  status: string;
};

type Props = {
  initialUsers: PendingUser[];
  callerIsMaster: boolean;
};

const ROLE_COLORS_LIGHT: Record<string, string> = {
  MASTER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-uph-blue/10 text-uph-blue',
  KAPRODI: 'bg-red-100 text-red-700',
  KOORDINATOR: 'bg-teal-100 text-teal-700',
  DOSEN: 'bg-gray-100 text-gray-700',
};

const ROLE_COLORS_DARK: Record<string, string> = {
  MASTER: 'bg-purple-900/50 text-purple-400',
  ADMIN: 'bg-blue-900/50 text-blue-400',
  KAPRODI: 'bg-red-900/50 text-red-400',
  KOORDINATOR: 'bg-teal-900/50 text-teal-400',
  DOSEN: 'bg-gray-800 text-gray-400',
};

const ASSIGNABLE_ROLES_ADMIN = ['KAPRODI', 'KOORDINATOR', 'DOSEN'] as const;
const ASSIGNABLE_ROLES_MASTER = ['ADMIN', 'KAPRODI', 'KOORDINATOR', 'DOSEN'] as const;

export function ApprovalsClient({ initialUsers, callerIsMaster }: Props) {
  const dark = callerIsMaster;
  const ROLE_COLORS = dark ? ROLE_COLORS_DARK : ROLE_COLORS_LIGHT;

  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvingUser, setApprovingUser] = useState<PendingUser | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['DOSEN']);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const assignableRoles = callerIsMaster ? ASSIGNABLE_ROLES_MASTER : ASSIGNABLE_ROLES_ADMIN;

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  function openApproveModal(user: PendingUser) {
    setApprovingUser(user);
    setSelectedRoles(['DOSEN']);
  }

  function toggleRole(role: string, checked: boolean) {
    if (role === 'DOSEN') return;
    setSelectedRoles(prev =>
      checked ? [...prev, role] : prev.filter(r => r !== role)
    );
  }

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    if (!approvingUser) return;
    setIsSaving(true);

    const res = await fetch(`/api/users/${approvingUser.id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', roles: selectedRoles }),
    });

    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== approvingUser.id));
      setApprovingUser(null);
      showSuccess(`Akun ${approvingUser.name} berhasil disetujui.`);
    } else {
      alert('Gagal menyetujui akun. Silakan coba lagi.');
    }
    setIsSaving(false);
  }

  async function handleReject(user: PendingUser) {
    if (!confirm(`Tolak akun ${user.name}? Tindakan ini tidak dapat dibatalkan.`)) return;

    const res = await fetch(`/api/users/${user.id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    });

    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showSuccess(`Akun ${user.name} telah ditolak.`);
    } else {
      alert('Gagal menolak akun. Silakan coba lagi.');
    }
  }

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-playfair font-bold mb-1 ${dark ? 'text-gray-100' : 'text-uph-blue'}`}>Persetujuan Akun</h1>
        <p className="text-gray-500">Tinjau dan setujui pendaftaran akun baru dari dosen.</p>
      </div>

      {successMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${dark ? 'bg-green-900/30 border border-green-700 text-green-400 font-mono' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      <div className={`rounded-2xl overflow-hidden ${dark ? 'bg-gray-950 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between gap-4 flex-wrap ${dark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-yellow-500" />
            <span className={`text-sm font-semibold ${dark ? 'text-gray-400 font-mono' : 'text-gray-600'}`}>
              {users.length} akun menunggu persetujuan
            </span>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-600' : 'text-gray-400'}`} size={15} />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none ${dark ? 'bg-gray-800 border border-gray-700 text-gray-300 placeholder-gray-600 focus:border-purple-500 font-mono' : 'border border-gray-200 focus:border-uph-blue'}`}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b ${dark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                {['Nama', 'Email', 'Status', 'Aksi'].map((h, i) => (
                  <th key={h} className={`py-3 px-6 text-xs font-semibold uppercase tracking-wider ${dark ? 'text-gray-500 font-mono' : 'text-gray-500'} ${i === 3 ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? 'divide-gray-800' : 'divide-gray-50'}`}>
              {filteredUsers.length > 0 ? filteredUsers.map(user => (
                <tr key={user.id} className={`transition-colors ${dark ? 'hover:bg-gray-900/50' : 'hover:bg-gray-50/50'}`}>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${dark ? 'bg-yellow-900/30 text-yellow-400 font-mono' : 'bg-yellow-100 text-yellow-600'}`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`font-semibold ${dark ? 'text-gray-200 font-mono text-sm' : 'text-gray-800'}`}>{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-sm text-gray-500 font-mono">{user.email}</td>
                  <td className="py-3.5 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider border ${dark ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800 font-mono' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                      <Clock size={10} /> Menunggu
                    </span>
                  </td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openApproveModal(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        <UserCheck size={13} /> Setujui
                      </button>
                      <button
                        onClick={() => handleReject(user)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${dark ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-800' : 'bg-red-50 hover:bg-red-100 text-uph-red border-red-200'}`}
                      >
                        <UserX size={13} /> Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <CheckCircle size={36} className="mx-auto mb-3 text-green-500 opacity-30" />
                    <p className={`font-medium ${dark ? 'text-gray-500 font-mono' : 'text-gray-400'}`}>Tidak ada akun yang menunggu persetujuan.</p>
                    <p className={`text-sm mt-1 ${dark ? 'text-gray-600' : 'text-gray-300'}`}>Semua pendaftaran telah diproses.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {approvingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${dark ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${dark ? 'bg-gray-800/40 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
              <div>
                <h2 className={`text-lg font-bold ${dark ? 'text-gray-100 font-mono' : 'text-gray-800'}`}>Setujui Akun</h2>
                <p className={`text-sm ${dark ? 'text-gray-500 font-mono' : 'text-gray-500'}`}>{approvingUser.name} — {approvingUser.email}</p>
              </div>
              <button onClick={() => setApprovingUser(null)} className={`p-1 rounded-full ${dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200'}`}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleApprove} className="p-6 space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-3 ${dark ? 'text-gray-500 font-mono' : 'text-gray-700'}`}>
                  Tetapkan Role
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {!selectedRoles.includes('ADMIN') && !selectedRoles.includes('MASTER') && (
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-not-allowed opacity-60 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <input type="checkbox" checked readOnly disabled className="accent-purple-500 w-4 h-4" />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase font-mono ${ROLE_COLORS['DOSEN']}`}>DOSEN</span>
                      <span className={`ml-auto text-[10px] italic ${dark ? 'text-gray-600' : 'text-gray-500'}`}>Base Role</span>
                    </label>
                  )}
                  {assignableRoles.filter(r => r !== 'DOSEN').map(role => {
                    const isChecked = selectedRoles.includes(role);
                    return (
                      <label
                        key={role}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                          isChecked
                            ? dark ? 'bg-purple-900/30 border-purple-600' : 'bg-uph-blue/10 border-uph-blue'
                            : dark ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => toggleRole(role, e.target.checked)}
                          className="accent-purple-500 w-4 h-4"
                        />
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase font-mono ${ROLE_COLORS[role]}`}>{role}</span>
                      </label>
                    );
                  })}
                </div>
                <p className={`mt-3 text-[12px] ${dark ? 'text-gray-600 font-mono' : 'text-gray-400'}`}>
                  Role DOSEN ditambahkan otomatis untuk semua akun akademis.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovingUser(null)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg border ${dark ? 'border-gray-700 text-gray-400 hover:bg-gray-800 font-mono' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Menyimpan...' : 'Setujui Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
