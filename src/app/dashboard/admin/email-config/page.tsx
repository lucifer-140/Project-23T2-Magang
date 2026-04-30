'use client';

import { useEffect, useState } from 'react';
import { Save, Send, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
  enabled: boolean;
}

const PROVIDERS = [
  {
    id: 'gmail',
    label: 'Gmail',
    description: '@gmail.com',
    logo: (
      <svg viewBox="0 0 48 48" className="w-7 h-7"><path fill="#EA4335" d="M24 24.5L6 13V9l18 12 18-12v4z"/><path fill="#4285F4" d="M6 13v26h36V13L24 24.5z"/><path fill="#34A853" d="M42 39H6v-2l18-12 18 12z"/><path fill="#FBBC05" d="M6 9h36v4L24 24.5 6 13z"/></svg>
    ),
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    secure: false,
    hint: 'Butuh App Password, bukan password Gmail biasa.',
    hintLink: 'https://myaccount.google.com/apppasswords',
    hintLinkLabel: 'Buat App Password →',
  },
  {
    id: 'yahoo',
    label: 'Yahoo Mail',
    description: '@yahoo.com',
    logo: (
      <svg viewBox="0 0 48 48" className="w-7 h-7"><rect width="48" height="48" rx="8" fill="#6001D2"/><text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="22" fontWeight="bold">Y!</text></svg>
    ),
    smtpHost: 'smtp.mail.yahoo.com',
    smtpPort: 587,
    secure: false,
    hint: 'Aktifkan "Allow apps that use less secure sign in" di pengaturan Yahoo, atau gunakan App Password.',
  },
  {
    id: 'uph',
    label: 'Email UPH',
    description: '@uph.edu',
    logo: (
      <div className="w-7 h-7 rounded-md bg-uph-blue flex items-center justify-center">
        <span className="text-white text-xs font-bold leading-none">UPH</span>
      </div>
    ),
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    secure: false,
    hint: 'Email UPH berjalan di Microsoft Office 365. Gunakan email dan password akun UPH Anda.',
  },
  {
    id: 'custom',
    label: 'Lainnya',
    description: 'Domain sendiri',
    logo: (
      <div className="w-7 h-7 rounded-md bg-gray-200 flex items-center justify-center">
        <span className="text-gray-600 text-lg font-bold leading-none">@</span>
      </div>
    ),
    smtpHost: '',
    smtpPort: 587,
    secure: false,
    hint: 'Isi detail SMTP secara manual sesuai panduan dari penyedia email Anda.',
  },
];

const defaultConfig: EmailConfig = {
  smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '',
  fromEmail: '', fromName: 'Portal Akademik UPH', secure: false, enabled: false,
};

type Toast = { type: 'success' | 'error'; message: string };

function detectProvider(smtpHost: string) {
  if (smtpHost.includes('gmail')) return 'gmail';
  if (smtpHost.includes('yahoo')) return 'yahoo';
  if (smtpHost.includes('office365') || smtpHost.includes('uph')) return 'uph';
  if (smtpHost) return 'custom';
  return null;
}

export default function EmailConfigPage() {
  const [config, setConfig] = useState<EmailConfig>(defaultConfig);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testTo, setTestTo] = useState('');

  function showToast(type: Toast['type'], message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  useEffect(() => {
    fetch('/api/admin/email-config')
      .then(r => r.json())
      .then(data => {
        setConfig(data);
        setSelectedProvider(detectProvider(data.smtpHost));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function pickProvider(pid: string) {
    setSelectedProvider(pid);
    const p = PROVIDERS.find(x => x.id === pid)!;
    setConfig(prev => ({
      ...prev,
      smtpHost: p.smtpHost,
      smtpPort: p.smtpPort,
      secure: p.secure,
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/email-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) showToast('success', 'Konfigurasi berhasil disimpan.');
      else showToast('error', 'Gagal menyimpan konfigurasi.');
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      // Auto-save first so test uses latest form values
      const saveRes = await fetch('/api/admin/email-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!saveRes.ok) { showToast('error', 'Gagal menyimpan konfigurasi sebelum uji coba.'); return; }

      const res = await fetch('/api/admin/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testTo: testTo.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) showToast('success', 'Email tes berhasil dikirim! Periksa kotak masuk (dan folder Spam) Anda.');
      else showToast('error', `Gagal: ${data.error || 'Kesalahan tidak diketahui.'}`);
    } catch {
      showToast('error', 'Terjadi kesalahan jaringan.');
    } finally {
      setTesting(false);
    }
  }

  function set<K extends keyof EmailConfig>(key: K, value: EmailConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  const provider = PROVIDERS.find(p => p.id === selectedProvider);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-uph-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {toast && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
            : <XCircle size={16} className="text-red-600 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      <div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Konfigurasi Email</h1>
        <p className="text-gray-500">Hubungkan akun email untuk mengirim notifikasi kepada pengguna sistem.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Step 1: Pick provider */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <p className="font-bold text-gray-800 mb-0.5">Langkah 1 — Pilih layanan email</p>
            <p className="text-xs text-gray-400">Email apa yang ingin Anda gunakan untuk mengirim notifikasi?</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickProvider(p.id)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                  selectedProvider === p.id
                    ? 'border-uph-blue bg-uph-blue/5'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {p.logo}
                <div>
                  <p className="text-sm font-bold text-gray-800">{p.label}</p>
                  <p className="text-xs text-gray-400">{p.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Credentials */}
        {selectedProvider && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
            <div>
              <p className="font-bold text-gray-800 mb-0.5">Langkah 2 — Masukkan data akun email</p>
              <p className="text-xs text-gray-400">Akun ini akan digunakan sebagai pengirim email notifikasi.</p>
            </div>

            {/* Provider hint */}
            {provider?.hint && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-800 leading-relaxed">
                <strong>Perhatian:</strong> {provider.hint}{' '}
                {provider.hintLink && (
                  <a href={provider.hintLink} target="_blank" rel="noopener noreferrer"
                    className="underline font-semibold">{provider.hintLinkLabel}</a>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">
                  Alamat Email Pengirim
                </label>
                <input
                  type="email"
                  value={config.fromEmail}
                  onChange={e => { set('fromEmail', e.target.value); set('smtpUser', e.target.value); }}
                  placeholder={
                    selectedProvider === 'gmail' ? 'contoh@gmail.com' :
                    selectedProvider === 'yahoo' ? 'contoh@yahoo.com' :
                    selectedProvider === 'uph' ? 'nama@uph.edu' : 'email@domain.com'
                  }
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">
                  {selectedProvider === 'gmail' ? 'App Password Gmail' : 'Password Email'}
                </label>
                <input
                  type="password"
                  value={config.smtpPass}
                  onChange={e => set('smtpPass', e.target.value)}
                  placeholder={selectedProvider === 'gmail' ? 'xxxx xxxx xxxx xxxx' : '••••••••'}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">
                  Nama Pengirim <span className="text-gray-400 normal-case font-normal">(tampil di kotak masuk penerima)</span>
                </label>
                <input
                  type="text"
                  value={config.fromName}
                  onChange={e => set('fromName', e.target.value)}
                  placeholder="Portal Akademik UPH"
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
                />
              </div>
            </div>

            {/* Advanced toggle */}
            {selectedProvider === 'custom' && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-uph-blue transition-colors"
                >
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  Pengaturan SMTP Lanjutan
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">SMTP Host</label>
                        <input
                          type="text"
                          value={config.smtpHost}
                          onChange={e => set('smtpHost', e.target.value)}
                          placeholder="smtp.example.com"
                          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">Port</label>
                        <input
                          type="number"
                          value={config.smtpPort}
                          onChange={e => set('smtpPort', Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">Nama Pengguna SMTP</label>
                      <input
                        type="text"
                        value={config.smtpUser}
                        onChange={e => set('smtpUser', e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
                      />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">SSL/TLS</p>
                        <p className="text-xs text-gray-400">Aktifkan untuk port 465</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => set('secure', !config.secure)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.secure ? 'bg-uph-blue' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${config.secure ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Enable + Save */}
        {selectedProvider && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
              <p className="font-bold text-gray-800 mb-0.5">Langkah 3 — Aktifkan & simpan</p>
              <p className="text-xs text-gray-400">Aktifkan pengiriman email, lalu simpan dan uji coba.</p>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-semibold text-gray-700">Aktifkan pengiriman email notifikasi</p>
                <p className="text-xs text-gray-400 mt-0.5">Jika dinonaktifkan, sistem tidak akan mengirim email apapun.</p>
              </div>
              <button
                type="button"
                onClick={() => set('enabled', !config.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${config.enabled ? 'bg-uph-blue' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">
                Kirim Email Tes Ke
              </label>
              <input
                type="email"
                value={testTo}
                onChange={e => setTestTo(e.target.value)}
                placeholder="contoh@gmail.com (kosongkan = kirim ke akun Anda)"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || testing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-uph-blue text-white text-sm font-semibold hover:bg-uph-blue/90 disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Simpan
              </button>

              <button
                type="button"
                onClick={handleTest}
                disabled={testing || saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Kirim Email Tes
              </button>
            </div>
            <p className="text-xs text-gray-400">Tombol tes otomatis menyimpan konfigurasi lalu mengirim email. Jika tidak masuk di Kotak Masuk, cek folder <strong>Spam</strong>.</p>
          </div>
        )}
      </form>
    </div>
  );
}
