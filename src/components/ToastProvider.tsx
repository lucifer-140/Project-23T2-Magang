"use client";

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, Bell } from 'lucide-react';
import Link from 'next/link';

type Toast = { id: string; message: string; link?: string | null };
type ToastCtx = { addToast: (t: Omit<Toast, 'id'>) => void };

const ToastContext = createContext<ToastCtx>({ addToast: () => {} });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setToasts(p => p.filter(t => t.id !== id));
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { ...toast, id }].slice(-4));
    timers.current.set(id, setTimeout(() => remove(id), 5000));
  }, [remove]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 bg-white border border-uph-border shadow-lg rounded-xl px-4 py-3 w-80 animate-slide-in"
          >
            <Bell size={15} className="text-uph-blue flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug">{t.message}</p>
              {t.link && (
                <Link
                  href={t.link}
                  className="text-xs text-uph-blue font-semibold hover:underline mt-0.5 block"
                >
                  Lihat →
                </Link>
              )}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 -mt-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
