import Image from 'next/image';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function LoginPage() {
  
  async function handleLogin(formData: FormData) {
    "use server"
    const username = formData.get('username') as string;
    
    const cookieStore = await cookies();
    // Quick prototype mock auth:
    if (username === 'admin') {
      cookieStore.set('userRole', 'ADMIN');
      redirect('/dashboard/admin');
    } else if (username === 'dosen') {
      cookieStore.set('userRole', 'DOSEN');
      redirect('/dashboard/dosen');
    } else {
      // In a real app we'd show an error state
      redirect('/?error=invalid');
    }
  }

  return (
    <>
      {/* Background circles mimicking the ::before and ::after pseudo-elements */}
      <div className="absolute top-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full bg-uph-red/10 pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-60px] w-[260px] h-[260px] rounded-full bg-white/5 pointer-events-none" />

      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-white rounded-2xl pt-12 px-11 pb-10 w-full max-w-[420px] relative z-10 shadow-[0_24px_64px_rgba(0,0,0,0.35)]">
          {/* Top accent */}
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

          <form action={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-uph-blue tracking-wider uppercase mb-2">
                Username
              </label>
              <input 
                type="text" 
                id="username" 
                name="username" 
                placeholder="Masukkan username Anda (< admin | dosen >)" 
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
                <a href="#" className="text-xs text-uph-red hover:underline">
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

          <p className="text-center mt-5 text-xs text-gray-400">
            © 2026 <span className="text-uph-blue font-semibold">Universitas Pelita Harapan</span>. All rights reserved.
          </p>
        </div>
      </main>
    </>
  );
}
