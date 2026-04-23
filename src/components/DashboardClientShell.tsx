"use client";

import { ToastProvider } from './ToastProvider';
import { SWRProvider } from './SWRProvider';
import NotificationBell from './NotificationBell';

export function DashboardClientShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top header bar */}
        <header className="h-14 bg-white border-b border-uph-border flex items-center justify-end px-6 sticky top-0 z-10 shadow-sm flex-shrink-0">
          <NotificationBell />
        </header>

        <div className="p-8 flex-1 flex flex-col">
          <div className="max-w-5xl mx-auto w-full flex-1">
            <SWRProvider>{children}</SWRProvider>
          </div>

          <footer className="max-w-5xl mx-auto w-full mt-12 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              &copy; {new Date().getFullYear()} lucifer-140. All rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </ToastProvider>
  );
}
