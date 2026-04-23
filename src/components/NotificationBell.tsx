"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useToast } from './ToastProvider';

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
  const prevIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const { addToast } = useToast();

  const fetchNotifs = async () => {
    const res = await fetch('/api/notifications');
    if (!res.ok) return;
    const data: Notif[] = await res.json();

    if (initialized.current) {
      for (const n of data) {
        if (!prevIds.current.has(n.id)) {
          addToast({ message: n.message, link: n.link });
        }
      }
    }

    prevIds.current = new Set(data.map(n => n.id));
    initialized.current = true;
    setNotifs(data);
  };

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 5000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-500 hover:text-uph-blue hover:bg-blue-50 transition-colors"
        aria-label="Notifikasi"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-uph-red text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-uph-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Notifikasi</p>
            {unread > 0 && (
              <span className="text-xs font-bold text-uph-red">{unread} baru</span>
            )}
          </div>
          {notifs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Tidak ada notifikasi</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
              {notifs.map(n => (
                <li key={n.id} className={!n.isRead ? 'bg-blue-50/50' : ''}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(n.createdAt).toLocaleString('id-ID')}
                      </p>
                    </Link>
                  ) : (
                    <div className="px-4 py-3">
                      <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(n.createdAt).toLocaleString('id-ID')}
                      </p>
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
