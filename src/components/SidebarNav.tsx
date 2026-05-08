"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  subItem?: boolean;
}

export default function SidebarNav({ navItems, collapsed = false, dark = false }: { navItems: NavItem[]; collapsed?: boolean; dark?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const isActive =
          item.href === '/dashboard/dosen' || item.href === '/dashboard/admin' ||
          item.href === '/dashboard/master' || item.href === '/dashboard/kaprodi'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`flex items-center rounded-lg transition-colors ${
              item.subItem
                ? collapsed ? 'justify-center px-2 py-2 ml-0' : `space-x-3 pl-8 pr-4 py-2 text-xs font-medium border-l-2 ${dark ? 'border-green-900' : 'border-gray-200'} ml-4 rounded-l-none`
                : collapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-4 py-3 text-sm font-semibold'
            } ${
              isActive
                ? dark ? 'bg-green-400/10 text-green-400 border-l-2 border-green-500' : 'bg-uph-blue/10 text-uph-blue'
                : dark ? 'text-gray-500 hover:text-green-400 hover:bg-green-400/5' : 'text-gray-600 hover:text-uph-red hover:bg-red-50'
            }`}
          >
            <span className={isActive ? (dark ? 'text-green-400' : 'text-uph-blue') : (dark ? 'text-gray-600' : 'text-gray-400')}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
