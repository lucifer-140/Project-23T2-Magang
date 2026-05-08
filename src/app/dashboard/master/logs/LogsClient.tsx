"use client";

import useSWR from 'swr';
import { useState } from 'react';
import { FileText } from 'lucide-react';
import type { LogEntry } from '@/lib/api-types';
import { SyncIndicator } from '@/components/SyncIndicator';

type Props = { initialLogs: LogEntry[] };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const LEVELS = ['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const;
const SOURCES = [
  { value: 'all', label: 'Semua Sumber' },
  { value: 'rps', label: 'RPS' },
  { value: 'doc', label: 'Dokumen' },
  { value: 'bap', label: 'BAP' },
  { value: 'cr', label: 'Change Request' },
  { value: 'system', label: 'System' },
];

export function LogsClient({ initialLogs }: Props) {
  const [level, setLevel] = useState('ALL');
  const [source, setSource] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const params = new URLSearchParams();
  if (level !== 'ALL') params.set('level', level);
  if (source !== 'all') params.set('source', source);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const url = `/api/logs?${params.toString()}`;

  const { data, isValidating, error } = useSWR<LogEntry[]>(
    url,
    fetcher,
    { fallbackData: initialLogs, refreshInterval: 5000, revalidateOnFocus: false }
  );

  const logs = data ?? initialLogs;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
          <FileText size={20} className="text-green-400" />
        </div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue">Application Logs</h1>
      </div>
      <p className="text-gray-500 mb-8">Real-time audit trail — rekam jejak semua perubahan data di sistem.</p>

      {/* Log Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Total', value: logs.length, color: 'border-gray-200 text-gray-700' },
          { label: 'INFO',  value: logs.filter(l => l.level === 'INFO').length,  color: 'border-green-200 text-green-700' },
          { label: 'WARN',  value: logs.filter(l => l.level === 'WARN').length,  color: 'border-yellow-200 text-yellow-700' },
          { label: 'ERROR', value: logs.filter(l => l.level === 'ERROR').length, color: 'border-red-200 text-red-700' },
          { label: 'DEBUG', value: logs.filter(l => l.level === 'DEBUG').length, color: 'border-gray-200 text-gray-400' },
        ].map(stat => (
          <div key={stat.label} className={`bg-white p-4 rounded-xl border ${stat.color} shadow-sm`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-60">{stat.label}</p>
            <p className={`text-3xl font-playfair font-bold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Level tabs */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                level === l
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Source dropdown */}
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          {SOURCES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Date range */}
        <input
          type="datetime-local"
          value={from}
          onChange={e => setFrom(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        <input
          type="datetime-local"
          value={to}
          onChange={e => setTo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
        {(from || to) && (
          <button
            onClick={() => { setFrom(''); setTo(''); }}
            className="text-xs text-gray-400 hover:text-gray-700 px-2"
          >
            Reset tanggal
          </button>
        )}
      </div>

      {/* Log Table */}
      <div className="bg-gray-950 rounded-2xl shadow-xl overflow-hidden border border-gray-800">
        <div className="px-6 py-3 bg-gray-900 border-b border-gray-800 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs font-mono text-gray-400">system.log — {logs.length} entries</span>
        </div>

        <div className="grid grid-cols-[140px_60px_1fr_160px_180px] gap-4 px-6 py-2 bg-gray-900 border-b border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
          <span>Timestamp</span>
          <span>Level</span>
          <span>Message</span>
          <span>Actor</span>
          <span>Action</span>
        </div>

        <div className="divide-y divide-gray-900 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-600 font-mono text-sm">No log entries found.</div>
          ) : (
            logs.map(log => (
              <div key={log.id} className="grid grid-cols-[140px_60px_1fr_160px_180px] gap-4 px-6 py-3 hover:bg-gray-900/50 transition-colors items-start">
                <span className="text-[11px] font-mono text-gray-500 pt-0.5">
                  {log.timestamp.replace('T', ' ').substring(0, 19)}
                </span>
                <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded uppercase w-fit ${log.levelColor}`}>
                  {log.level}
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
                <span className="text-[10px] font-mono text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded w-fit">{log.action}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <SyncIndicator isValidating={isValidating} error={error} />
    </div>
  );
}
