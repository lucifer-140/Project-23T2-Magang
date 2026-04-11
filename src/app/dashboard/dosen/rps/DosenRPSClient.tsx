"use client";

import { useState, useRef } from 'react';
import useSWR from 'swr';
import { FileUp, Clock, CheckCircle, AlertCircle, UploadCloud, XCircle, BookOpen, Download } from 'lucide-react';
import type { MatkulRps } from '@/lib/api-types';
import { SyncIndicator } from '@/components/SyncIndicator';

type Props = { matkulRpsData: MatkulRps[]; userId: string };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Helper to normalize data to MatkulRps[] format
// Handles both MatkulRps[] and RpsApiResponse (when KAPRODI/KOORDINATOR visit this page)
function normalizeData(data: any): MatkulRps[] {
  if (!data) return [];
  // If it's already an array (MatkulRps[]), return it
  if (Array.isArray(data)) {
    return data;
  }
  // If it's an object with submissions property (RpsApiResponse from reviewer role),
  // return empty array since reviewers viewing the dosen page don't have matkuls
  if (data.submissions !== undefined && data.assignments !== undefined) {
    return [];
  }
  return [];
}

export function DosenRPSClient({ matkulRpsData: initialData, userId }: Props) {
  const { data, mutate, isValidating, error } = useSWR<any>(
    '/api/rps',
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 5000,
      revalidateOnFocus: false,
    }
  );

  const data_ = normalizeData(data ?? initialData);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleUpload(matkulId: string, rpsId: string | null, file: File) {
    setUploading(matkulId);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('matkulId', matkulId);
    formData.append('dosenId', userId);
    if (rpsId) formData.append('rpsId', rpsId);

    const res = await fetch('/api/rps/upload', { method: 'POST', body: formData });
    if (res.ok) {
      setUploading(null);
      mutate();
    } else {
      setUploading(null);
    }
  }

  function getStatusBadge(status: string, isKoordinatorApproved: boolean) {
    if (status === 'UNSUBMITTED')
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Belum Submit</span>;
    if (status === 'SUBMITTED' && !isKoordinatorApproved)
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600"><Clock size={12} className="mr-1.5" />Menunggu Koordinator</span>;
    if (status === 'PENGECEKAN' && !isKoordinatorApproved)
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-600"><AlertCircle size={12} className="mr-1.5" />Pengecekan Koordinator</span>;
    if (status === 'SUBMITTED' && isKoordinatorApproved)
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700"><Clock size={12} className="mr-1.5" />Menunggu Kaprodi</span>;
    if (status === 'PENGECEKAN' && isKoordinatorApproved)
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700"><AlertCircle size={12} className="mr-1.5" />Pengecekan Kaprodi</span>;
    if (status === 'APPROVED')
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600"><CheckCircle size={12} className="mr-1.5" />Disetujui</span>;
    if (status === 'REVISION')
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600"><XCircle size={12} className="mr-1.5" />Perlu Revisi</span>;
    return null;
  }

  const canUpload = (status: string) => status === 'UNSUBMITTED' || status === 'REVISION';

  return (
    <div>
      <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-2">Kelola RPS</h1>
      <p className="text-gray-500 mb-8">
        Daftar mata kuliah yang Anda ampuh. Unggah dokumen RPS untuk setiap mata kuliah yang ditugaskan.
      </p>

      {data_.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Belum ada mata kuliah yang ditugaskan kepada Anda.</p>
          <p className="text-sm text-gray-400 mt-1">Hubungi Admin untuk mendapatkan penugasan mata kuliah.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Mata Kuliah</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">File Dokumen</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 tracking-wider uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data_.map(rps => (
                <tr key={rps.matkulId} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 align-top">
                    <h3 className="font-bold text-gray-800 mb-0.5">{rps.matkulName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-uph-blue/10 text-uph-blue rounded px-2 py-0.5 font-bold uppercase">{rps.matkulCode}</span>
                      <span className="text-xs text-gray-400">{rps.sks} SKS</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 align-top max-w-[200px]">
                    {rps.fileName ? (
                      <span className={`flex items-center text-sm font-medium ${rps.status === 'REVISION' ? 'text-gray-400 line-through' : 'text-uph-blue'}`}>
                        <FileUp size={14} className="mr-2 flex-shrink-0" />
                        <a href={rps.fileUrl ?? '#'} className="hover:underline truncate" title={rps.fileName}>{rps.fileName}</a>
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 italic">- Belum ada file -</span>
                    )}
                  </td>
                  <td className="py-4 px-6 align-top">
                    <div className="flex flex-col gap-1.5">
                      {getStatusBadge(rps.status, rps.isKoordinatorApproved)}
                      {rps.status === 'REVISION' && (rps.kaprodiNotes || rps.koordinatorNotes) && (
                        <div className="mt-1">
                          <span className="text-[11px] text-orange-500 font-bold block">
                            Catatan {rps.kaprodiNotes ? 'Kaprodi' : 'Koordinator'}:
                          </span>
                          <span className="text-[11px] text-gray-500 leading-snug">
                            {rps.kaprodiNotes ?? rps.koordinatorNotes}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 align-top text-center">
                    {rps.status === 'APPROVED' ? (
                      <a
                        href={rps.finalPdfUrl ?? rps.fileUrl ?? '#'}
                        className="inline-flex items-center shrink-0 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        <Download size={14} className="mr-1.5" /> Download PDF
                      </a>
                    ) : canUpload(rps.status) ? (
                      <label className={`inline-flex items-center shrink-0 px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer ${uploading === rps.matkulId ? 'bg-gray-400' : 'bg-uph-red hover:bg-uph-redHover'}`}>
                        {uploading === rps.matkulId ? (
                          <span className="animate-pulse">Mengunggah...</span>
                        ) : (
                          <>
                            <UploadCloud size={14} className="mr-1.5" />
                            {rps.status === 'REVISION' ? 'Re-Upload' : 'Unggah File'}
                          </>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          disabled={!!uploading}
                          ref={el => { fileInputRefs.current[rps.matkulId] = el; }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(rps.matkulId, rps.rpsId, file);
                          }}
                        />
                      </label>
                    ) : (
                      <span className="inline-flex items-center shrink-0 px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-bold rounded-lg cursor-not-allowed">
                        <UploadCloud size={14} className="mr-1.5" /> Unggah File
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SyncIndicator isValidating={isValidating} error={error} />
    </div>
  );
}
