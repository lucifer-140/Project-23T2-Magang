"use client";

import { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

const ROLE_LABELS: Record<string, string> = {
  MASTER: 'Developer',
  ADMIN: 'Administrator',
  KAPRODI: 'Ketua Program Studi',
  KOORDINATOR: 'Koordinator',
  DOSEN: 'Dosen',
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/users/me')
      .then(r => r.json())
      .then((data: UserProfile) => {
        setProfile(data);
        setName(data.name);
        setEmail(data.email);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password baru tidak cocok.' });
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }

    setSaving(true);
    const body: Record<string, string> = { name, email };
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage({ type: 'error', text: data.error || 'Gagal menyimpan.' });
    } else {
      setProfile(data);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-uph-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-playfair font-bold text-uph-blue">Pengaturan Akun</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi profil dan keamanan akun Anda.</p>
      </div>

      {/* Role badge */}
      <div className="mb-6 flex flex-wrap gap-2">
        {profile?.roles.map(r => (
          <span key={r} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-uph-blue border border-blue-100">
            {ROLE_LABELS[r] ?? r}
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile info */}
        <div className="bg-white rounded-xl border border-uph-border p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Informasi Profil</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-uph-border rounded-lg focus:outline-none focus:ring-2 focus:ring-uph-blue/20 focus:border-uph-blue transition-colors"
                placeholder="Nama lengkap"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-uph-border rounded-lg focus:outline-none focus:ring-2 focus:ring-uph-blue/20 focus:border-uph-blue transition-colors"
                placeholder="email@example.com"
              />
            </div>
          </div>
        </div>

        {/* Password change */}
        <div className="bg-white rounded-xl border border-uph-border p-6 space-y-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Ubah Password</h2>
          <p className="text-xs text-gray-400">Kosongkan jika tidak ingin mengubah password.</p>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Lama</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-uph-border rounded-lg focus:outline-none focus:ring-2 focus:ring-uph-blue/20 focus:border-uph-blue transition-colors"
                placeholder="Password saat ini"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Baru</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-uph-border rounded-lg focus:outline-none focus:ring-2 focus:ring-uph-blue/20 focus:border-uph-blue transition-colors"
                placeholder="Minimal 6 karakter"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-uph-border rounded-lg focus:outline-none focus:ring-2 focus:ring-uph-blue/20 focus:border-uph-blue transition-colors"
                placeholder="Ulangi password baru"
              />
            </div>
          </div>
        </div>

        {/* Feedback */}
        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success'
              ? <CheckCircle size={16} />
              : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-uph-blue text-white text-sm font-semibold rounded-lg hover:bg-uph-blue/90 disabled:opacity-60 transition-colors"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
