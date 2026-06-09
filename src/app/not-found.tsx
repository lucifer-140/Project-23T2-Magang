import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function NotFound() {
  const h = await headers();
  const route = h.get('x-invoke-path') ?? h.get('referer') ?? 'unknown';

  await prisma.systemLog.create({
    data: { level: 'WARN', route, message: `404 Not Found: ${route}` },
  }).catch(() => {});

  return (
    <main className="flex min-h-screen items-center justify-center bg-uph-grayBg p-4">
      <div className="text-center">
        <p className="text-6xl font-playfair font-bold text-uph-blue mb-4">404</p>
        <p className="text-gray-500 mb-6">Halaman tidak ditemukan.</p>
        <Link href="/" className="px-5 py-2.5 bg-uph-blue text-white rounded-lg text-sm font-semibold hover:bg-uph-blue/90 transition-colors">
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
