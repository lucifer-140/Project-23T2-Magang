import Image from 'next/image';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  async function handleLogin(formData: FormData) {
    "use server"
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const user = await prisma.user.findUnique({ where: { email } });

    const cookieStore = await cookies();

    if (!user || user.password !== password) {
      redirect('/?error=invalid');
    }

    cookieStore.set('userRole', JSON.stringify(user.roles)); // store as JSON array
    cookieStore.set('userId', user.id);
    cookieStore.set('userName', user.name);

    if (user.roles.includes('MASTER')) {
      redirect('/dashboard/master');
    } else if (user.roles.includes('ADMIN')) {
      redirect('/dashboard/admin');
    } else {
      // KAPRODI, KOORDINATOR, and DOSEN share the same page
      redirect('/dashboard/dosen');
    }
  }

  return (
    <>
      <div className="absolute top-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full bg-uph-red/10 pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-60px] w-[260px] h-[260px] rounded-full bg-white/5 pointer-events-none" />

      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-white rounded-2xl pt-12 px-11 pb-10 w-full max-w-[420px] relative z-10 shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
          <div className="absolute top-0 left-0 right-0 h-[5px] bg-uph-red rounded-t-2xl" />

          <div className="text-center mb-8 flex flex-col items-center">
            <Image
              src="/Gambar/Logo UPH.png"
              alt="Logo UPH"
              width={100}
              height={100}
              className="mb-3 object-contain"
            />
            <h1 className="font-playfair text-[22px] text-uph-blue tracking-wide">
              Portal Akademik
            </h1>
            <p className="text-[13px] text-gray-400 mt-1 tracking-wider uppercase font-semibold">
              Sistem Administrasi UPH
            </p>
          </div>

          <div className="h-[1px] bg-gray-200 mb-7" />

          {error === 'invalid' && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium text-center">
              Email atau password salah.
            </div>
          )}

          <form action={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-uph-blue tracking-wider uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="dosen@test.com"
                required
                className="w-full px-3.5 py-2.5 text-[15px] font-sans border-2 border-uph-border rounded-lg text-uph-blue bg-uph-grayBg focus:outline-none focus:border-uph-blue focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-uph-blue tracking-wider uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Masukkan password Anda"
                required
                className="w-full px-3.5 py-2.5 text-[15px] font-sans border-2 border-uph-border rounded-lg text-uph-blue bg-uph-grayBg focus:outline-none focus:border-uph-blue focus:bg-white transition-colors"
              />
              <div className="text-right mt-1.5">
                <a href="/forgot-password" className="text-xs text-uph-red hover:underline">
                  Lupa password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 p-[13px] bg-uph-red hover:bg-uph-redHover active:scale-95 text-white font-sans text-[15px] font-semibold tracking-wide rounded-lg transition-all"
            >
              Masuk
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-[13px] text-gray-500">
              Belum punya akun?{' '}
              <a href="/signup" className="text-uph-blue font-semibold hover:underline">
                Daftar sekarang
              </a>
            </p>
          </div>

          <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-[11px] text-gray-400 text-center font-semibold uppercase tracking-wider mb-2">Akun Test (Selalu gunakan password: [nama]123)</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-500">
              <span>master@test.com</span>
              <span>kaprodi@test.com</span>
              <span>admin@test.com</span>
              <span>dosen@test.com</span>
              <span>koordinator@test.com</span>
              <span>dosen2@test.com (dosen123)</span>
            </div>
          </div>

          <p className="text-center mt-5 text-xs text-gray-400">
            © 2026 <span className="text-uph-blue font-semibold">Universitas Pelita Harapan</span>. All rights reserved.
          </p>
        </div>
      </main>
    </>
  );
}
