import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard, FileText, LogOut, User, BookOpen,
  Users, Settings, Shield, Terminal, Bell
} from 'lucide-react';
import Image from 'next/image';

type RoleConfig = {
  label: string;
  subtitle: string;
  basePath: string;
  navItems: { href: string; icon: React.ReactNode; label: string }[];
  accentColor: string;
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const roleStr = cookieStore.get('userRole')?.value;
  const userName = cookieStore.get('userName')?.value ?? 'User';

  if (!roleStr) redirect('/');
  // Safely decode cookie value
  let decodedRoleStr = roleStr || '';
  try { decodedRoleStr = decodeURIComponent(decodedRoleStr); } catch(e) {}

  // Parse roles array
  let roles: string[] = [];
  try {
    const parsed = JSON.parse(decodedRoleStr);
    if (Array.isArray(parsed)) roles = parsed;
    else roles = [parsed]; // fallback if it was a scalar
  } catch (e) {
    roles = [decodedRoleStr]; // fallback
  }

  let config: RoleConfig;

  // MASTER gets exclusive config
  if (roles.includes('MASTER')) {
    config = {
      label: 'Developer',
      subtitle: 'System Master',
      basePath: '/dashboard/master',
      accentColor: 'bg-purple-600',
      navItems: [
        { href: '/dashboard/master', icon: <Terminal size={18} />, label: 'System Monitor' },
        { href: '/dashboard/master/users', icon: <Users size={18} />, label: 'Kelola Pengguna' },
        { href: '/dashboard/master/logs', icon: <FileText size={18} />, label: 'Application Logs' },
      ],
    };
  } 
  // ADMIN gets exclusive config
  else if (roles.includes('ADMIN')) {
    config = {
      label: 'Admin',
      subtitle: 'Administrator',
      basePath: '/dashboard/admin',
      accentColor: 'bg-uph-blue',
      navItems: [
        { href: '/dashboard/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { href: '/dashboard/admin/matkul', icon: <BookOpen size={18} />, label: 'Kelola Matkul' },
        { href: '/dashboard/admin/users', icon: <Users size={18} />, label: 'Kelola Pengguna' },
      ],
    };
  } 
  // Combinable roles (KAPRODI, KOORDINATOR, DOSEN)
  else {
    const combinedNavItems = [
      { href: '/dashboard/dosen', icon: <LayoutDashboard size={18} />, label: 'Dashboard' }
    ];

    if (roles.includes('KAPRODI')) {
      combinedNavItems.push({ href: '/dashboard/kaprodi/rps', icon: <FileText size={18} />, label: 'Review RPS' });
      combinedNavItems.push({ href: '/dashboard/kaprodi/requests', icon: <Bell size={18} />, label: 'Permintaan Perubahan' });
    }
    
    // Base DOSEN item
    combinedNavItems.push({ href: '/dashboard/dosen/rps', icon: <FileText size={18} />, label: 'Kelola RPS' });

    let labelStr = 'Dosen';
    if (roles.includes('KAPRODI') && roles.includes('KOORDINATOR')) labelStr = 'Kaprodi & Koordinator';
    else if (roles.includes('KAPRODI')) labelStr = 'Kaprodi';
    else if (roles.includes('KOORDINATOR')) labelStr = 'Koordinator';

    config = {
      label: labelStr,
      subtitle: 'Portal Akademik',
      basePath: '/dashboard/dosen',
      accentColor: 'bg-uph-blue',
      navItems: combinedNavItems,
    };
  }

  async function handleLogout() {
    "use server"
    const cookieStore = await cookies();
    cookieStore.delete('userRole');
    cookieStore.delete('userId');
    cookieStore.delete('userName');
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

        {/* Role Badge */}
        <div className={`px-4 py-2 ${config.accentColor} text-white`}>
          <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">Mode: {config.label}</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {config.navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center space-x-3 text-sm font-semibold text-gray-600 hover:text-uph-red hover:bg-red-50 px-4 py-3 rounded-lg transition-colors"
            >
              <span className="text-gray-400">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 mb-4 px-4">
            <div className={`w-9 h-9 rounded-full ${config.accentColor} text-white flex items-center justify-center font-bold text-sm`}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-gray-800 truncate">{userName}</span>
              <span className="text-xs text-gray-500">{config.subtitle}</span>
            </div>
          </div>
          <form action={handleLogout}>
            <button className="flex w-full items-center space-x-3 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 px-4 py-3 rounded-lg transition-colors">
              <LogOut size={18} />
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
