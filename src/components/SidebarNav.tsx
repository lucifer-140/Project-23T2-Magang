"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function SidebarNav({ navItems, collapsed = false }: { navItems: NavItem[]; collapsed?: boolean }) {
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
            className={`flex items-center text-sm font-semibold rounded-lg transition-colors ${
              collapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-4 py-3'
            } ${
              isActive
                ? 'bg-uph-blue/10 text-uph-blue'
                : 'text-gray-600 hover:text-uph-red hover:bg-red-50'
            }`}
          >
            <span className={isActive ? 'text-uph-blue' : 'text-gray-400'}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
