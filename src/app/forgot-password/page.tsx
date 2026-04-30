'use client';

import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError('');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus('sent');
    } catch {
      setError('Terjadi kesalahan jaringan. Silakan coba lagi.');
      setStatus('idle');
    }
  }

  return (
    <>
      <div className="absolute top-[-80px] right-[-80px] w-[340px] h-[340px] rounded-full bg-uph-blue/5 pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-[260px] h-[260px] rounded-full bg-uph-red/5 pointer-events-none" />

      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-white rounded-2xl pt-10 px-10 pb-8 w-full max-w-[440px] relative z-10 shadow-[0_24px_64px_rgba(0,0,0,0.15)] border border-gray-100">
          <div className="absolute top-0 left-0 right-0 h-[5px] bg-uph-blue rounded-t-2xl" />

          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-uph-blue mb-6 transition-colors">
            <ArrowLeft size={16} className="mr-1.5" />
            Kembali ke Login
          </Link>

          {status === 'sent' ? (
            <div className="text-center py-4">
              <CheckCircle size={40} className="mx-auto text-green-500 mb-4" />
              <h2 className="font-playfair text-xl font-bold text-gray-800 mb-2">Email Terkirim</h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Jika email <strong>{email}</strong> terdaftar di sistem, Anda akan menerima link reset password dalam beberapa menit.
              </p>
              <Link href="/" className="text-uph-blue text-sm font-bold hover:underline">Kembali ke Login</Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6 flex flex-col items-center">
                <div className="w-12 h-12 bg-uph-blue/10 text-uph-blue rounded-full flex items-center justify-center mb-4">
                  <Mail size={24} />
                </div>
                <h1 className="font-playfair text-[22px] font-bold text-gray-800 tracking-wide mb-1">
                  Lupa Password
                </h1>
                <p className="text-[13px] text-gray-500 px-4">
                  Masukkan alamat email Anda dan kami akan mengirimkan link untuk mereset password.
                </p>
              </div>

              <div className="h-[1px] bg-gray-100 mb-6" />

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="budi.santoso@uph.edu"
                    required
                    className="w-full px-3.5 py-2.5 text-[14px] font-sans border border-gray-200 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full mt-2 p-[13px] bg-uph-blue hover:bg-uph-blue/90 active:scale-95 disabled:opacity-60 text-white font-sans text-[14px] font-semibold tracking-wide rounded-lg transition-all"
                >
                  {status === 'loading' ? 'Mengirim...' : 'Kirim Link Reset'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}
