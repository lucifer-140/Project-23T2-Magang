"use client";

import useSWR from 'swr';
import { FileText } from 'lucide-react';
import type { LogEntry } from '@/lib/api-types';
import { SyncIndicator } from '@/components/SyncIndicator';

type Props = { initialLogs: LogEntry[] };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function LogsClient({ initialLogs }: Props) {
  const { data, isValidating, error } = useSWR<LogEntry[]>(
    '/api/logs',
    fetcher,
    {
      fallbackData: initialLogs,
      refreshInterval: 5000,
      revalidateOnFocus: false,
    }
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
      <p className="text-gray-500 mb-8">Real-time audit trail - rekam jejak semua perubahan data di sistem.</p>

      {/* Log Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Logs', value: logs.length, color: 'border-gray-200 text-gray-700' },
          { label: 'INFO', value: logs.filter((l) => l.level === 'INFO').length, color: 'border-green-200 text-green-700' },
          { label: 'WARN', value: logs.filter((l) => l.level === 'WARN').length, color: 'border-yellow-200 text-yellow-700' },
          { label: 'DEBUG', value: logs.filter((l) => l.level === 'DEBUG').length, color: 'border-gray-200 text-gray-400' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white p-4 rounded-xl border ${stat.color} shadow-sm`}>
            <p className="text-xs font-bold uppercase tracking-wider opacity-60">{stat.label}</p>
            <p className={`text-3xl font-playfair font-bold mt-1 ${stat.color.split(' ')[1]}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Log Table */}
      <div className="bg-gray-950 rounded-2xl shadow-xl overflow-hidden border border-gray-800">
        <div className="px-6 py-3 bg-gray-900 border-b border-gray-800 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs font-mono text-gray-400">system.log - {logs.length} entries</span>
        </div>

        {/* Header */}
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
            logs.map((log) => (
              <div key={log.id} className="grid grid-cols-[140px_60px_1fr_160px_180px] gap-4 px-6 py-3 hover:bg-gray-900/50 transition-colors items-start">
                {/* Timestamp */}
                <span className="text-[11px] font-mono text-gray-500 pt-0.5">
                  {log.timestamp.replace('T', ' ').substring(0, 19)}
                </span>

                {/* Level Badge */}
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase w-fit ${log.levelColor}`}>
                  {log.level}
                </span>

                {/* Message */}
                <span className="text-xs font-mono text-gray-300 leading-relaxed">{log.message}</span>

                {/* Actor */}
                <span className="text-xs font-mono text-green-400 truncate">{log.actor}</span>

                {/* Action */}
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
