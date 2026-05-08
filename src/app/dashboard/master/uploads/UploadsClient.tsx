"use client";

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { HardDrive, ExternalLink, Trash2 } from 'lucide-react';
import type { UploadsResponse, UploadFile } from '@/lib/api-types';
import { SyncIndicator } from '@/components/SyncIndicator';

type Props = { initial: UploadsResponse };

const fetcher = (url: string) => fetch(url).then(r => r.json());

const EXT_COLORS: Record<string, string> = {
  pdf:   'bg-red-100 text-red-700',
  doc:   'bg-blue-100 text-blue-700',
  docx:  'bg-blue-100 text-blue-700',
  png:   'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-500',
};

export function UploadsClient({ initial }: Props) {
  const { data, isValidating, error, mutate } = useSWR<UploadsResponse>(
    '/api/master/uploads',
    fetcher,
    { fallbackData: initial, refreshInterval: 30000, revalidateOnFocus: false }
  );
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(relativePath: string, name: string) {
    if (!confirm(`Hapus file "${name}"?\n\nFile akan dihapus permanen dari disk. Data di database tidak otomatis diperbarui.`)) return;
    setDeleting(relativePath);
    try {
      const res = await fetch('/api/master/uploads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relativePath }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        alert(`Gagal: ${error}`);
      } else {
        mutate();
      }
    } finally {
      setDeleting(null);
    }
  }

  const resp = data ?? initial;
  const [folderFilter, setFolderFilter] = useState('all');
  const [extFilter, setExtFilter] = useState('all');
  const [search, setSearch] = useState('');

  const folders = useMemo(() => ['all', ...Object.keys(resp.stats.byFolder).sort()], [resp.stats.byFolder]);

  const files: UploadFile[] = useMemo(() => {
    return resp.files.filter(f => {
      if (folderFilter !== 'all' && f.folder !== folderFilter) return false;
      if (extFilter !== 'all' && f.ext !== extFilter) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [resp.files, folderFilter, extFilter, search]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
          <HardDrive size={20} className="text-white" />
        </div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue">File Browser</h1>
      </div>
      <p className="text-gray-500 mb-8">
        All uploaded files — {resp.stats.totalFiles} files · {resp.stats.totalSizeHuman} total
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {Object.entries(resp.stats.byFolder)
          .sort((a, b) => b[1].count - a[1].count)
          .map(([folder, info]) => (
            <button
              key={folder}
              onClick={() => setFolderFilter(folderFilter === folder ? 'all' : folder)}
              className={`p-3 rounded-xl border text-left transition-colors ${
                folderFilter === folder
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white border-gray-200 hover:border-purple-300'
              }`}
            >
              <p className={`text-xs font-bold uppercase tracking-wide truncate ${folderFilter === folder ? 'text-purple-100' : 'text-gray-500'}`}>
                {folder}
              </p>
              <p className={`text-xl font-playfair font-bold mt-0.5 ${folderFilter === folder ? 'text-white' : 'text-gray-800'}`}>
                {info.count}
              </p>
              <p className={`text-[10px] mt-0.5 ${folderFilter === folder ? 'text-purple-200' : 'text-gray-400'}`}>
                {info.sizeHuman}
              </p>
            </button>
          ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama file..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <select
          value={extFilter}
          onChange={e => setExtFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          <option value="all">Semua tipe</option>
          <option value="pdf">PDF</option>
          <option value="doc">DOC</option>
          <option value="docx">DOCX</option>
          <option value="png">Gambar</option>
          <option value="other">Lainnya</option>
        </select>
        <select
          value={folderFilter}
          onChange={e => setFolderFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          {folders.map(f => (
            <option key={f} value={f}>{f === 'all' ? 'Semua folder' : f}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-widest grid grid-cols-[1fr_120px_80px_80px_160px_48px_40px] gap-4">
          <span>Nama File</span>
          <span>Folder</span>
          <span>Tipe</span>
          <span>Ukuran</span>
          <span>Diubah</span>
          <span></span>
          <span></span>
        </div>
        <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
          {files.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">Tidak ada file.</div>
          ) : (
            files.map(f => (
              <div key={f.relativePath} className="grid grid-cols-[1fr_120px_80px_80px_160px_48px_40px] gap-4 px-6 py-3 items-center hover:bg-gray-50/50">
                <span className="text-xs font-mono text-gray-800 truncate" title={f.relativePath}>{f.name}</span>
                <span className="text-xs text-gray-500 truncate">{f.folder}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase w-fit ${EXT_COLORS[f.ext] ?? EXT_COLORS.other}`}>
                  {f.ext}
                </span>
                <span className="text-xs text-gray-500">{f.sizeHuman}</span>
                <span className="text-xs font-mono text-gray-400">
                  {f.modifiedAt.replace('T', ' ').substring(0, 16)}
                </span>
                <a
                  href={encodeURI(f.publicUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-500 hover:text-purple-700"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => handleDelete(f.relativePath, f.name)}
                  disabled={deleting === f.relativePath}
                  className="text-red-400 hover:text-red-600 disabled:opacity-40"
                  title="Hapus file"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          Menampilkan {files.length} dari {resp.stats.totalFiles} file
        </div>
      </div>

      <SyncIndicator isValidating={isValidating} error={error} />
    </div>
  );
}
