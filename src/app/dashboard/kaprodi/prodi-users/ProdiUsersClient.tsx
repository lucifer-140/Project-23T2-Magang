"use client";

import { useState } from 'react';
import { Shield, ShieldOff, Search } from 'lucide-react';

type User = { id: string; name: string; email: string; roles: string[] };

const ROLE_COLORS: Record<string, string> = {
  KAPRODI: 'bg-red-100 text-red-700',
  KOORDINATOR: 'bg-teal-100 text-teal-700',
  DOSEN: 'bg-gray-100 text-gray-700',
  PRODI: 'bg-indigo-100 text-indigo-700',
};

export function ProdiUsersClient({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleProdi(user: User) {
    const hasProdi = user.roles.includes('PRODI');
    const newRoles = hasProdi
      ? user.roles.filter(r => r !== 'PRODI')
      : [...user.roles, 'PRODI'];

    setLoadingId(user.id);
    const res = await fetch(`/api/users/${user.id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: newRoles }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, roles: newRoles } : u));
    } else {
      const err = await res.json();
      alert(err.error ?? 'Gagal mengubah role PRODI.');
    }
    setLoadingId(null);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Kelola Role PRODI</h1>
        <p className="text-gray-500">Tetapkan atau cabut role PRODI pada dosen. Pengguna PRODI akan mereview semua dokumen LPP & EPP.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roles</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">PRODI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length > 0 ? filtered.map(user => {
                const hasProdi = user.roles.includes('PRODI');
                const isLoading = loadingId === user.id;
                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-500 font-mono">{user.email}</td>
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
                      <button
                        onClick={() => toggleProdi(user)}
                        disabled={isLoading}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 ${
                          hasProdi
                            ? 'bg-indigo-100 text-indigo-700 hover:bg-red-50 hover:text-red-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700'
                        }`}
                      >
                        {isLoading ? (
                          <span>Menyimpan...</span>
                        ) : hasProdi ? (
                          <><ShieldOff size={13} /> Cabut PRODI</>
                        ) : (
                          <><Shield size={13} /> Tetapkan PRODI</>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    <Shield size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Tidak ada dosen ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
