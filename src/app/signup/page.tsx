import Image from 'next/image';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  async function handleSignup(formData: FormData) {
    "use server"
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      redirect('/signup?error=password_mismatch');
    }

    if (!name || !email || !password) {
      redirect('/signup?error=missing_fields');
    }

    try {
      // Check if email already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        redirect('/signup?error=email_taken');
      }

      // Create new user with base DOSEN role and PENDING status
      await prisma.user.create({
        data: {
          name,
          email,
          password, // NOTE: In a real app, hash this password here using bcrypt!
          roles: ['DOSEN'],
          status: 'PENDING',
        }
      });

      // Redirect to lobby to wait for admin approval
      redirect('/lobby');
    } catch (e: unknown) {
      if (isRedirectError(e)) throw e;
      redirect('/signup?error=server_error');
    }
  }

  return (
    <>
      <div className="absolute top-[-80px] right-[-80px] w-[340px] h-[340px] rounded-full bg-uph-blue/5 pointer-events-none" />
      <div className="absolute bottom-[-60px] left-[-60px] w-[260px] h-[260px] rounded-full bg-uph-red/5 pointer-events-none" />

      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-white rounded-2xl pt-10 px-10 pb-8 w-full max-w-[440px] relative z-10 shadow-[0_24px_64px_rgba(0,0,0,0.15)] border border-gray-100">
          <div className="absolute top-0 left-0 right-0 h-[5px] bg-uph-blue rounded-t-2xl" />

          <div className="text-center mb-6 flex flex-col items-center">
            <div className="w-12 h-12 bg-uph-blue/10 text-uph-blue rounded-full flex items-center justify-center mb-4">
              <UserPlus size={24} />
            </div>
            <h1 className="font-playfair text-[22px] font-bold text-gray-800 tracking-wide mb-1">
              Buat Akun Baru
            </h1>
            <p className="text-[13px] text-gray-500">
              Daftar untuk mengakses Portal Akademik
            </p>
          </div>

          <div className="h-[1px] bg-gray-100 mb-6" />

          {error === 'password_mismatch' && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium text-center">
              Password tidak sesuai. Silakan coba lagi.
            </div>
          )}
          {error === 'email_taken' && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium text-center">
              Email sudah terdaftar di sistem.
            </div>
          )}
          {error === 'missing_fields' && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium text-center">
              Mohon lengkapi semua kolom.
            </div>
          )}
          {error === 'server_error' && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium text-center">
              Terjadi kesalahan sistem, silakan coba beberapa saat lagi.
            </div>
          )}

          <form action={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Dr. Budi Santoso"
                required
                className="w-full px-3.5 py-2.5 text-[14px] font-sans border border-gray-200 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="budi.santoso@uph.edu"
                required
                className="w-full px-3.5 py-2.5 text-[14px] font-sans border border-gray-200 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 text-[14px] font-sans border border-gray-200 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-gray-700 tracking-wider uppercase mb-1.5">
                Konfirmasi Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Ulangi password Anda"
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 text-[14px] font-sans border border-gray-200 rounded-lg text-gray-800 bg-gray-50 focus:outline-none focus:border-uph-blue focus:bg-white focus:ring-1 focus:ring-uph-blue transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 p-[13px] bg-uph-blue hover:bg-uph-blue/90 active:scale-95 text-white font-sans text-[14px] font-semibold tracking-wide rounded-lg transition-all"
            >
              Daftar Sekarang
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[13px] text-gray-500">
              Sudah memiliki akun?{' '}
              <Link href="/" className="text-uph-blue font-bold hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
