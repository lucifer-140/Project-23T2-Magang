'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { Clock, CheckCircle, AlertCircle, FileText, Search, Filter } from 'lucide-react';

const DOC_TYPE_LABELS: Record<string, string> = {
  RPS: 'RPS', SOAL_UTS: 'Soal UTS', SOAL_UAS: 'Soal UAS',
  LPP: 'LPP', EPP_UTS: 'EPP UTS', EPP_UAS: 'EPP UAS', BERITA_ACARA: 'Berita Acara',
};

const EPP_METRIC_LABELS: { key: string; label: string }[] = [
  { key: 'eppPersentaseMateri',    label: 'Kesesuaian Materi' },
  { key: 'eppPersentaseCpmk',      label: 'Kesesuaian CPMK' },
  { key: 'eppPersentaseKehadiran', label: 'Kehadiran Mahasiswa' },
  { key: 'eppPersentaseNilaiB',    label: 'Nilai ≥ B' },
  { key: 'eppPersentaseKkmToB',    label: 'KKM ≤ Nilai < B' },
];

const STATUS_COLORS: Record<string, string> = {
  APPROVED:    '#22c55e',
  SUBMITTED:   '#eab308',
  PENGECEKAN:  '#3b82f6',
  REVISION:    '#f87171',
  UNSUBMITTED: '#d1d5db',
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED:    'Disetujui',
  SUBMITTED:   'Dikirim',
  PENGECEKAN:  'Pengecekan',
  REVISION:    'Revisi',
  UNSUBMITTED: 'Belum Upload',
};

interface Semester { id: string; label: string; }
interface Stats { needsReview: number; approved: number; revision: number; pengecekan: number; totalDocs: number; }
interface TypeRow { type: string; APPROVED: number; SUBMITTED: number; PENGECEKAN: number; REVISION: number; UNSUBMITTED: number; }
interface EppMetrics {
  count: number;
  eppPersentaseMateri: number;
  eppPersentaseCpmk: number;
  eppPersentaseKehadiran: number;
  eppPersentaseNilaiB: number;
  eppPersentaseKkmToB: number;
}

interface ApiResponse {
  semesters: Semester[];
  stats: Stats;
  typeBreakdown: TypeRow[];
  eppMetrics: EppMetrics | null;
}

export default function KaprodiDashboardClient() {
  const [semesterId, setSemesterId] = useState<string>('');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = semesterId
      ? `/api/analytics/kaprodi?semesterId=${semesterId}`
      : '/api/analytics/kaprodi';
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then((d: ApiResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [semesterId]);

  const stats = data?.stats;
  const eppMetrics = data?.eppMetrics;
  const typeBreakdown = data?.typeBreakdown ?? [];
  const semesters = data?.semesters ?? [];

  const eppChartData = EPP_METRIC_LABELS.map(m => ({
    label: m.label,
    value: eppMetrics ? (eppMetrics as unknown as Record<string, number>)[m.key] ?? 0 : 0,
  }));

  const typeChartData = typeBreakdown.map(row => ({
    ...row,
    name: DOC_TYPE_LABELS[row.type] ?? row.type,
  }));

  return (
    <div className="space-y-6">
      {/* Semester Filter */}
      <div className="flex items-center gap-3">
        <Filter size={15} className="text-gray-400" />
        <select
          value={semesterId}
          onChange={e => setSemesterId(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-uph-blue/30 focus:border-uph-blue"
        >
          <option value="">Semua Semester</option>
          {semesters.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        {loading && <span className="text-xs text-gray-400 animate-pulse">Memuat...</span>}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Perlu Review',  value: stats?.needsReview  ?? '—', color: 'border-l-yellow-500', icon: <Clock       size={15} className="text-yellow-500 opacity-50" /> },
          { label: 'Pengecekan',    value: stats?.pengecekan   ?? '—', color: 'border-l-blue-500',   icon: <Search      size={15} className="text-blue-500 opacity-50"   /> },
          { label: 'Disetujui',     value: stats?.approved     ?? '—', color: 'border-l-green-500',  icon: <CheckCircle size={15} className="text-green-500 opacity-50"  /> },
          { label: 'Revisi',        value: stats?.revision     ?? '—', color: 'border-l-red-400',    icon: <AlertCircle size={15} className="text-red-400 opacity-50"    /> },
          { label: 'Total Dokumen', value: stats?.totalDocs    ?? '—', color: 'border-l-uph-blue',   icon: <FileText    size={15} className="text-uph-blue opacity-50"   /> },
        ].map(s => (
          <div key={s.label} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 ${s.color}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">{s.label}</span>
              {s.icon}
            </div>
            <p className="text-3xl font-playfair font-bold text-uph-blue">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Doc Type Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 text-sm mb-4">Sebaran Dokumen per Tipe</h3>
          {typeChartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada data dokumen.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value, name) => [value, STATUS_LABELS[String(name)] ?? String(name)]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Legend formatter={(v) => STATUS_LABELS[v] ?? v} wrapperStyle={{ fontSize: 11 }} />
                {(['APPROVED','SUBMITTED','PENGECEKAN','REVISION','UNSUBMITTED'] as const).map(status => (
                  <Bar key={status} dataKey={status} stackId="a" fill={STATUS_COLORS[status]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* EPP Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 text-sm">Rata-rata EPP</h3>
            {eppMetrics && (
              <span className="text-xs text-gray-400">{eppMetrics.count} dokumen EPP</span>
            )}
          </div>
          {!eppMetrics ? (
            <p className="text-sm text-gray-400 text-center py-8">Belum ada data EPP.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                layout="vertical"
                data={eppChartData}
                margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              >
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  width={130}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Rata-rata']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {eppChartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.value >= 75 ? '#22c55e' : entry.value >= 50 ? '#eab308' : '#f87171'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
