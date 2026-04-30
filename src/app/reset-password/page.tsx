'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, CheckCircle, XCircle } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!token) {
    return (
      <div className="text-center">
        <XCircle size={40} className="mx-auto text-red-500 mb-4" />
        <p className="text-gray-700 font-semibold">Link tidak valid.</p>
        <Link href="/" className="text-uph-blue text-sm font-bold hover:underline mt-4 inline-block">Kembali ke Login</Link>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <CheckCircle size={40} className="mx-auto text-green-500 mb-4" />
        <h2 className="font-playfair text-xl font-bold text-gray-800 mb-2">Password Berhasil Diubah</h2>
        <p className="text-gray-500 text-sm mb-6">Silakan masuk dengan password baru Anda.</p>
        <Link href="/" className="inline-block bg-uph-blue text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-uph-blue/90 transition-colors">
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setErrorMsg('Password tidak sesuai.'); return; }
    if (password.length < 6) { setErrorMsg('Password minimal 6 karakter.'); return; }

    setStatus('loading');
    setErrorMsg('');

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setStatus('success');
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error || 'Terjadi kesalahan. Silakan coba lagi.');
      setStatus('error');
    }
  }

  return (
    <>
      <div className="text-center mb-6 flex flex-col items-center">
        <div className="w-12 h-12 bg-uph-blue/10 text-uph-blue rounded-full flex items-center justify-center mb-4">
          <KeyRound size={24} />
        </div>
        <h1 className="font-playfair text-[22px] font-bold text-gray-800 tracking-wide mb-1">Buat Password Baru</h1>
        <p className="text-[13px] text-gray-500">Masukkan password baru Anda di bawah ini.</p>
      </div>

      <div className="h-[1px] bg-gray-100 mb-6" />

      {(status === 'error' || errorMsg) && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">Password Baru</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            required
            minLength={6}
            className="w-full px-3.5 py-2.5 text-[14px] border border-gray-200 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">Konfirmasi Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Ulangi password baru"
            required
            minLength={6}
            className="w-full px-3.5 py-2.5 text-[14px] border border-gray-200 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full mt-4 p-[13px] bg-uph-blue hover:bg-uph-blue/90 active:scale-95 disabled:opacity-60 text-white font-sans text-[14px] font-semibold tracking-wide rounded-lg transition-all"
        >
          {status === 'loading' ? 'Menyimpan...' : 'Simpan Password Baru'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/" className="text-[13px] text-uph-blue font-bold hover:underline">Kembali ke Login</Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <div className="absolute top-[-80px] right-[-80px] w-[340px] h-[340px] rounded-full bg-uph-blue/5 pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-[260px] h-[260px] rounded-full bg-uph-red/5 pointer-events-none" />
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-white rounded-2xl pt-10 px-10 pb-8 w-full max-w-[440px] relative z-10 shadow-[0_24px_64px_rgba(0,0,0,0.15)] border border-gray-100">
          <div className="absolute top-0 left-0 right-0 h-[5px] bg-uph-blue rounded-t-2xl" />
          <Suspense fallback={<div className="text-center text-gray-400 py-8">Memuat...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
    </>
  );
}
