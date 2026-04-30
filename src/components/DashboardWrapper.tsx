"use client";

import { useState } from 'react';
import Image from 'next/image';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import SidebarNav from './SidebarNav';
import { ToastProvider } from './ToastProvider';
import { SWRProvider } from './SWRProvider';
import NotificationBell from './NotificationBell';
import UserMenuButton from './UserMenuButton';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface Props {
  children: React.ReactNode;
  userName: string;
  navItems: NavItem[];
}

export default function DashboardWrapper({ children, userName, navItems }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-uph-grayBg flex">
        {/* Sidebar */}
        <aside
          className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 shadow-sm z-20 transition-all duration-200`}
        >
          {/* Logo */}
          <div className={`border-b border-gray-100 flex flex-col items-center overflow-hidden ${collapsed ? 'py-3 px-2' : 'p-5 gap-2'}`}>
            <Image
              src="/Gambar/Logo UPH.png"
              alt="Logo UPH"
              width={collapsed ? 36 : 96}
              height={collapsed ? 36 : 96}
              className="object-contain transition-all duration-200"
            />
            {!collapsed && (
              <div className="flex flex-col items-center">
                <span className="font-playfair font-bold text-uph-blue leading-tight text-lg">Portal</span>
                <span className="text-xs text-gray-500 font-semibold tracking-wide uppercase">Akademik</span>
              </div>
            )}
          </div>

          {/* Nav */}
          <SidebarNav navItems={navItems} collapsed={collapsed} />

          {/* Collapse toggle */}
          <div className="p-3 border-t border-gray-100 flex justify-center">
            <button
              onClick={() => setCollapsed(c => !c)}
              className="p-2 rounded-lg text-gray-400 hover:text-uph-blue hover:bg-blue-50 transition-colors"
              aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className={`${collapsed ? 'ml-16' : 'ml-64'} flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden transition-all duration-200`}>
          <header className="h-14 bg-white border-b border-uph-border flex items-center justify-end gap-2 px-6 sticky top-0 z-10 shadow-sm flex-shrink-0">
            <NotificationBell />
            <UserMenuButton userName={userName} />
          </header>

          <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
            <div className="w-full flex-1">
              <SWRProvider>{children}</SWRProvider>
            </div>

            <footer className="w-full mt-12 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-400 text-center">
                &copy; {new Date().getFullYear()} lucifer-140. All rights reserved.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
