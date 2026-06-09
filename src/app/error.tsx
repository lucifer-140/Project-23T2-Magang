'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message || 'Unknown client error',
        route: window.location.pathname,
        stack: error.stack,
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-uph-grayBg p-4">
      <div className="text-center max-w-sm">
        <p className="text-5xl font-playfair font-bold text-uph-red mb-4">500</p>
        <p className="text-gray-600 mb-2 font-semibold">Terjadi kesalahan</p>
        <p className="text-gray-400 text-sm mb-6">{error.message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-uph-blue text-white rounded-lg text-sm font-semibold hover:bg-uph-blue/90 transition-colors"
          >
            Coba Lagi
          </button>
          <Link href="/dashboard" className="px-5 py-2.5 border-2 border-gray-200 text-gray-500 rounded-lg text-sm font-semibold hover:border-gray-300 transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
