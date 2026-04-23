import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard, FileText, LogOut, BookOpen,
  Users, Shield, Terminal, UserCheck, Library, BarChart2
} from 'lucide-react';
import SidebarNav from '@/components/SidebarNav';
import { DashboardClientShell } from '@/components/DashboardClientShell';
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
  let decodedRoleStr = roleStr || '';
  try { decodedRoleStr = decodeURIComponent(decodedRoleStr); } catch(e) {}

  let roles: string[] = [];
  try {
    const parsed = JSON.parse(decodedRoleStr);
    if (Array.isArray(parsed)) roles = parsed;
    else roles = [parsed];
  } catch (e) {
    roles = [decodedRoleStr];
  }

  let config: RoleConfig;

  if (roles.includes('MASTER')) {
    config = {
      label: 'Developer',
      subtitle: 'System Master',
      basePath: '/dashboard/master',
      accentColor: 'bg-purple-600',
      navItems: [
        { href: '/dashboard/master', icon: <Terminal size={18} />, label: 'System Monitor' },
        { href: '/dashboard/master/users', icon: <Users size={18} />, label: 'Kelola Pengguna' },
        { href: '/dashboard/master/approvals', icon: <UserCheck size={18} />, label: 'Persetujuan Akun' },
        { href: '/dashboard/master/logs', icon: <FileText size={18} />, label: 'Application Logs' },
      ],
    };
  } else if (roles.includes('ADMIN')) {
    config = {
      label: 'Admin',
      subtitle: 'Administrator',
      basePath: '/dashboard/admin',
      accentColor: 'bg-uph-blue',
      navItems: [
        { href: '/dashboard/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        { href: '/dashboard/admin/matkul', icon: <BookOpen size={18} />, label: 'Penugasan Matkul' },
        { href: '/dashboard/admin/users', icon: <Users size={18} />, label: 'Kelola Pengguna' },
        { href: '/dashboard/admin/approvals', icon: <UserCheck size={18} />, label: 'Persetujuan Akun' },
      ],
    };
  } else {
    const combinedNavItems = [
      { href: '/dashboard/dosen', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
      { href: '/dashboard/matkul', icon: <Library size={18} />, label: 'Mata Kuliah' },
    ];

    if (roles.includes('KAPRODI')) {
      combinedNavItems.push({ href: '/dashboard/kaprodi', icon: <BarChart2 size={18} />, label: 'Analitik Kaprodi' });
    }
    if (roles.includes('PRODI')) {
      combinedNavItems.push({ href: '/dashboard/prodi', icon: <Shield size={18} />, label: 'Review Dokumen' });
    }
    if (!roles.includes('KAPRODI')) {
      combinedNavItems.push({ href: '/dashboard/berita-acara', icon: <FileText size={18} />, label: 'Berita Acara Perwalian' });
    }

    let labelStr = 'Dosen';
    if (roles.includes('KAPRODI') && roles.includes('KOORDINATOR')) labelStr = 'Kaprodi & Koordinator';
    else if (roles.includes('KAPRODI')) labelStr = 'Kaprodi';
    else if (roles.includes('KOORDINATOR')) labelStr = 'Koordinator';
    else if (roles.includes('PRODI')) labelStr = 'PRODI';

    config = {
      label: labelStr,
      subtitle: 'Portal Akademik',
      basePath: '/dashboard/dosen',
      accentColor: 'bg-uph-blue',
      navItems: combinedNavItems,
    };
  }

  async function handleLogout() {
    "use server";
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
        <div className="p-5 border-b border-gray-100 flex flex-col items-center gap-2">
          <Image src="/Gambar/Logo UPH.png" alt="Logo UPH" width={96} height={96} className="object-contain" />
          <div className="flex flex-col items-center">
            <span className="font-playfair font-bold text-uph-blue leading-tight text-lg">Portal</span>
            <span className="text-xs text-gray-500 font-semibold tracking-wide uppercase">Akademik</span>
          </div>
        </div>

        <SidebarNav navItems={config.navItems} />

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

      {/* Main Content — handled by client shell (ToastProvider + header + SWR) */}
      <DashboardClientShell>{children}</DashboardClientShell>
    </div>
  );
}
