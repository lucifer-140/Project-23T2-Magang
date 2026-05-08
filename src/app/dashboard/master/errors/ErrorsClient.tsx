"use client";

import useSWR from 'swr';
import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import type { LogEntry } from '@/lib/api-types';
import { SyncIndicator } from '@/components/SyncIndicator';

type Props = { initialLogs: LogEntry[] };

const fetcher = (url: string) => fetch(url).then(r => r.json());

function StackRow({ log }: { log: LogEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-900 last:border-0">
      <div
        className="grid grid-cols-[140px_1fr_160px_120px_28px] gap-4 px-6 py-3 hover:bg-gray-900/50 cursor-pointer items-start"
        onClick={() => log.stack && setOpen(o => !o)}
      >
        <span className="text-[11px] font-mono text-gray-500 pt-0.5">
          {log.timestamp.replace('T', ' ').substring(0, 19)}
        </span>
        <div>
          <span className="text-xs font-mono text-gray-300">{log.message}</span>
          {log.route && (
            <span className="ml-2 text-[10px] font-mono text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">
              {log.route}
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-green-400 truncate">{log.actor}</span>
        <span className="text-xs font-mono text-gray-500">
          {log.timestamp.replace('T', ' ').substring(0, 10)}
        </span>
        {log.stack ? (
          open
            ? <ChevronDown size={14} className="text-gray-500 mt-0.5" />
            : <ChevronRight size={14} className="text-gray-500 mt-0.5" />
        ) : <span />}
      </div>
      {open && log.stack && (
        <div className="px-6 pb-4">
          <pre className="text-[10px] font-mono text-red-300 bg-gray-950 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
            {log.stack}
          </pre>
        </div>
      )}
    </div>
  );
}

export function ErrorsClient({ initialLogs }: Props) {
  const [route, setRoute] = useState('');

  const url = `/api/logs?level=ERROR&source=system${route ? `&route=${encodeURIComponent(route)}` : ''}`;

  const { data, isValidating, error } = useSWR<LogEntry[]>(
    url,
    fetcher,
    { fallbackData: initialLogs, refreshInterval: 10000, revalidateOnFocus: false }
  );

  const logs = data ?? initialLogs;

  const routes = [...new Set(initialLogs.map(l => l.route).filter(Boolean))] as string[];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
          <AlertTriangle size={20} className="text-white" />
        </div>
        <h1 className="text-3xl font-playfair font-bold text-gray-100">Error Logs</h1>
      </div>
      <p className="text-gray-500 mb-8">API errors captured from system routes. Auto-refreshes every 10s.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 p-4 rounded-xl border border-red-900/50 font-mono">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 opacity-70">Total Errors</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{logs.length}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 font-mono">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 opacity-70">Unique Routes</p>
          <p className="text-3xl font-bold text-gray-300 mt-1">
            {new Set(logs.map(l => l.route).filter(Boolean)).size}
          </p>
        </div>
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 font-mono">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 opacity-70">With Stack Trace</p>
          <p className="text-3xl font-bold text-gray-300 mt-1">
            {logs.filter(l => l.stack).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select
          value={route}
          onChange={e => setRoute(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-900"
        >
          <option value="">Semua route</option>
          {routes.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Terminal table */}
      <div className="bg-gray-950 rounded-2xl shadow-xl overflow-hidden border border-gray-800">
        <div className="px-6 py-3 bg-gray-900 border-b border-gray-800 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs font-mono text-gray-400">error.log — {logs.length} entries</span>
        </div>
        <div className="grid grid-cols-[140px_1fr_160px_120px_28px] gap-4 px-6 py-2 bg-gray-900 border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <span>Timestamp</span>
          <span>Message / Route</span>
          <span>Actor</span>
          <span>Date</span>
          <span></span>
        </div>
        <div className="divide-y divide-gray-900 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-600 font-mono text-sm">
              Tidak ada error. Sistem berjalan normal.
            </div>
          ) : (
            logs.map(log => <StackRow key={log.id} log={log} />)
          )}
        </div>
      </div>

      <SyncIndicator isValidating={isValidating} error={error} />
    </div>
  );
}
