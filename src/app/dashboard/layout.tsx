import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, FileText, LogOut, User } from 'lucide-react';
import Image from 'next/image';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const role = cookieStore.get('userRole')?.value;

  if (!role) {
    redirect('/');
  }

  const isDosen = role === 'DOSEN';
  const basePath = isDosen ? '/dashboard/dosen' : '/dashboard/admin';

  async function handleLogout() {
    "use server"
    const cookieStore = await cookies();
    cookieStore.delete('userRole');
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-uph-grayBg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 shadow-sm z-20">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
          <Image src="/Gambar/Logo UPH.png" alt="Logo UPH" width={40} height={40} className="object-contain" />
          <div className="flex flex-col">
            <span className="font-playfair font-bold text-uph-blue leading-tight">Portal</span>
            <span className="text-xs text-gray-500 font-semibold tracking-wide uppercase">Akademik</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href={basePath} 
            className="flex items-center space-x-3 text-sm font-semibold text-gray-600 hover:text-uph-red hover:bg-red-50 px-4 py-3 rounded-lg transition-colors"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>

          <Link 
            href={`${basePath}/rps`} 
            className="flex items-center space-x-3 text-sm font-semibold text-gray-600 hover:text-uph-red hover:bg-red-50 px-4 py-3 rounded-lg transition-colors"
          >
            <FileText size={20} />
            <span>Kelola RPS</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-uph-blue text-white flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-800">{isDosen ? 'Dosen' : 'Admin'}</span>
              <span className="text-xs text-gray-500">{isDosen ? 'Fakultas' : 'Kaprodi'}</span>
            </div>
          </div>
          <form action={handleLogout}>
            <button className="flex w-full items-center space-x-3 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg transition-colors">
              <LogOut size={20} />
              <span>Keluar</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
