import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard, FileText, BookOpen,
  Users, Shield, Terminal, UserCheck, Library, BarChart2, Database, Settings, School, HardDrive, AlertTriangle, Table2
} from 'lucide-react';
import DashboardWrapper from '@/components/DashboardWrapper';
import SessionGuard from '@/components/SessionGuard';
import AutoRefresh from '@/components/AutoRefresh';
import { validateSession } from '@/lib/auth';

type RoleConfig = {
  label: string;
  subtitle: string;
  basePath: string;
  navItems: { href: string; icon: React.ReactNode; label: string; subItem?: boolean }[];
  accentColor: string;
  theme?: 'dark';
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await validateSession();
  if (!session) redirect('/?error=session_expired');

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
      theme: 'dark' as const,
      navItems: [
        { href: '/dashboard/master', icon: <Terminal size={18} />, label: 'System Monitor' },
        { href: '/dashboard/master/users', icon: <Users size={18} />, label: 'Kelola Pengguna' },
        { href: '/dashboard/master/approvals', icon: <UserCheck size={18} />, label: 'Persetujuan Akun' },
        { href: '/dashboard/master/logs', icon: <FileText size={18} />, label: 'Application Logs' },
        { href: '/dashboard/master/uploads', icon: <HardDrive size={18} />, label: 'File Browser' },
        { href: '/dashboard/master/uploads/matrix', icon: <BarChart2 size={18} />, label: 'Matrix Dokumen', subItem: true },
        { href: '/dashboard/master/errors', icon: <AlertTriangle size={18} />, label: 'Error Logs' },
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
        { href: '/dashboard/admin/data-matkul', icon: <Database size={18} />, label: 'Data Matkul' },
        { href: '/dashboard/admin/kelas', icon: <School size={18} />, label: 'Kelola Kelas' },
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
      combinedNavItems.push({ href: '/dashboard/kaprodi/matrix', icon: <Table2 size={18} />, label: 'Matrix Dokumen' });
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

  config.navItems.push({ href: '/dashboard/settings', icon: <Settings size={18} />, label: 'Pengaturan' });

  return (
    <>
      <DashboardWrapper userName={userName} navItems={config.navItems} theme={config.theme}>
        {children}
      </DashboardWrapper>
      <SessionGuard />
      <AutoRefresh />
    </>
  );
}
