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
  subItem?: boolean;
}

interface Props {
  children: React.ReactNode;
  userName: string;
  navItems: NavItem[];
  theme?: 'dark';
}

export default function DashboardWrapper({ children, userName, navItems, theme }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const dark = theme === 'dark';

  return (
    <ToastProvider>
      <div className={`min-h-screen flex ${dark ? 'bg-gray-950' : 'bg-uph-grayBg'}`}>
        {/* Sidebar */}
        <aside
          className={`${collapsed ? 'w-16' : 'w-64'} ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r flex flex-col fixed inset-y-0 shadow-sm z-20 transition-all duration-200`}
        >
          {/* Logo */}
          <div className={`${dark ? 'border-gray-800' : 'border-gray-100'} border-b flex flex-col items-center overflow-hidden ${collapsed ? 'py-3 px-2' : 'p-5 gap-2'}`}>
            <div className={dark ? `bg-white/90 rounded-lg ${collapsed ? 'p-0.5' : 'p-1.5'}` : ''}>
              <Image
                src="/Gambar/Logo UPH.png"
                alt="Logo UPH"
                width={collapsed ? 36 : 96}
                height={collapsed ? 36 : 96}
                className="object-contain transition-all duration-200"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col items-center">
                <span className={`font-playfair font-bold leading-tight text-lg ${dark ? 'text-white' : 'text-uph-blue'}`}>Portal</span>
                <span className={`text-xs font-semibold tracking-wide uppercase ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Akademik</span>
              </div>
            )}
          </div>

          {/* Nav */}
          <SidebarNav navItems={navItems} collapsed={collapsed} dark={dark} />

          {/* Collapse toggle */}
          <div className={`p-3 border-t ${dark ? 'border-gray-800' : 'border-gray-100'} flex justify-center`}>
            <button
              onClick={() => setCollapsed(c => !c)}
              className={`p-2 rounded-lg transition-colors ${dark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-400 hover:text-uph-blue hover:bg-blue-50'}`}
              aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className={`${collapsed ? 'ml-16' : 'ml-64'} flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden transition-all duration-200`}>
          <header className={`h-14 ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-uph-border'} border-b flex items-center justify-end gap-2 px-6 sticky top-0 z-10 shadow-sm flex-shrink-0`}>
            <NotificationBell />
            <UserMenuButton userName={userName} />
          </header>

          <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col">
            <div className="w-full flex-1">
              <SWRProvider>{children}</SWRProvider>
            </div>

            <footer className={`w-full mt-12 pt-4 border-t ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
              <p className={`text-xs text-center ${dark ? 'text-gray-600' : 'text-gray-400'}`}>
                &copy; {new Date().getFullYear()} lucifer-140. All rights reserved.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
