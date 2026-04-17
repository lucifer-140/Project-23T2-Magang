"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function SidebarNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
            className={`flex items-center space-x-3 text-sm font-semibold px-4 py-3 rounded-lg transition-colors ${
              isActive
                ? 'bg-uph-blue/10 text-uph-blue'
                : 'text-gray-600 hover:text-uph-red hover:bg-red-50'
            }`}
          >
            <span className={isActive ? 'text-uph-blue' : 'text-gray-400'}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
