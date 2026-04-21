"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';

interface Notif {
  id: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    const res = await fetch('/api/notifications');
    if (res.ok) setNotifs(await res.json());
  };

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.isRead).length;

  const handleOpen = async () => {
    setOpen(o => !o);
    if (!open && unread > 0) {
      await fetch('/api/notifications/read', { method: 'PATCH' });
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  return (
    <div ref={ref} className="relative px-4 mb-2">
      <button onClick={handleOpen}
        className="flex w-full items-center gap-3 text-sm font-semibold text-gray-600 hover:text-uph-blue hover:bg-blue-50 px-4 py-3 rounded-lg transition-colors relative">
        <Bell size={18} />
        <span>Notifikasi</span>
        {unread > 0 && (
          <span className="absolute left-8 top-2 w-4 h-4 rounded-full bg-uph-red text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-4 right-0 mb-1 bg-white border border-uph-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Notifikasi</p>
          </div>
          {notifs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Tidak ada notifikasi</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {notifs.map(n => (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors">
                      <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString('id-ID')}</p>
                    </Link>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString('id-ID')}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
