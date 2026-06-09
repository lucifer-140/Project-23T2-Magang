'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
const WARNING_BEFORE_MS = 2 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const AUTO_REFRESH_INTERVAL_MS = 30 * 1000;

export default function SessionGuard() {
  const router = useRouter();
  const lastActivityRef = useRef(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_BEFORE_MS / 1000);
  const warningStartRef = useRef<number | null>(null);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/?error=session_expired');
  }, [router]);

  const sendHeartbeat = useCallback(async () => {
    const res = await fetch('/api/auth/heartbeat', { method: 'POST' });
    if (res.status === 401) {
      logout();
    }
  }, [logout]);

  const extendSession = useCallback(async () => {
    await sendHeartbeat();
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    warningStartRef.current = null;
    setCountdown(WARNING_BEFORE_MS / 1000);
  }, [sendHeartbeat]);

  // Track user activity
  useEffect(() => {
    const onActivity = () => { lastActivityRef.current = Date.now(); };
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach(e => window.removeEventListener(e, onActivity));
  }, []);

  // Idle check + heartbeat tick
  useEffect(() => {
    const tick = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;

      if (idleMs >= IDLE_TIMEOUT_MS) {
        logout();
        return;
      }

      if (idleMs >= IDLE_TIMEOUT_MS - WARNING_BEFORE_MS) {
        if (!warningStartRef.current) {
          warningStartRef.current = Date.now();
          setShowWarning(true);
        }
        const elapsed = Date.now() - warningStartRef.current;
        setCountdown(Math.max(0, Math.ceil((WARNING_BEFORE_MS - elapsed) / 1000)));
      } else {
        if (showWarning) {
          setShowWarning(false);
          warningStartRef.current = null;
          setCountdown(WARNING_BEFORE_MS / 1000);
        }
        // Send heartbeat if recently active
        if (idleMs < HEARTBEAT_INTERVAL_MS) {
          sendHeartbeat();
        }
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(tick);
  }, [showWarning, logout, sendHeartbeat]);

  // Auto-refresh router (keeps server data fresh)
  useEffect(() => {
    const id = setInterval(() => router.refresh(), AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  // Countdown reaches 0 → auto logout
  useEffect(() => {
    if (countdown === 0) logout();
  }, [countdown, logout]);

  if (!showWarning) return null;

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;
  const timeStr = `${mins}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="h-1.5 bg-uph-red" />
        <div className="p-7">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-uph-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
              </svg>
            </div>
            <div>
              <h2 className="font-playfair text-[17px] font-bold text-gray-800">Sesi Hampir Berakhir</h2>
              <p className="text-xs text-gray-400 mt-0.5">Karena tidak ada aktivitas</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-5">
            Sesi Anda akan otomatis berakhir dalam:
          </p>

          <div className="text-center mb-6">
            <span className="text-5xl font-mono font-bold text-uph-red tabular-nums">{timeStr}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => logout()}
              className="flex-1 py-2.5 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-500 hover:border-gray-300 transition-colors"
            >
              Keluar
            </button>
            <button
              onClick={extendSession}
              className="flex-1 py-2.5 bg-uph-blue hover:bg-uph-blue/90 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              Lanjutkan Sesi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
