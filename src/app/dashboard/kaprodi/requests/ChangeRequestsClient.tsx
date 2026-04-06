"use client";

import { useState } from 'react';
import { Bell, CheckCircle, XCircle, ArrowRight, Clock } from 'lucide-react';

type ChangeRequest = {
  id: string;
  matkulId: string;
  matkulName: string;
  matkulCode: string;
  currentSks: number;
  proposedName: string | null;
  proposedCode: string | null;
  proposedSks: number | null;
  reason: string | null;
  status: string;
  createdAt: string;
};

type Props = { requests: ChangeRequest[] };

export function ChangeRequestsClient({ requests: initialRequests }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const pending = requests.filter(r => r.status === 'PENDING');
  const decided = requests.filter(r => r.status !== 'PENDING');

  async function handleDecision(id: string, action: 'approve' | 'reject') {
    setIsSaving(id);
    const res = await fetch(`/api/change-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: updated.status } : r));
    }
    setIsSaving(null);
  }

  function DiffBadge({ label, from, to }: { label: string; from: string; to: string | null }) {
    if (!to || String(from) === String(to)) return null;
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-xs font-semibold text-gray-500 uppercase w-16">{label}</span>
        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded line-through text-xs">{from}</span>
        <ArrowRight size={12} className="text-gray-400" />
        <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold text-xs">{to}</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">Permintaan Perubahan Matkul</h1>
        <p className="text-gray-500">Tinjau dan berikan keputusan atas permintaan perubahan data mata kuliah dari Admin.</p>
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Bell size={14} className="text-yellow-500" />
            Menunggu Keputusan ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map(req => (
              <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-yellow-200 overflow-hidden">
                <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-800">{req.matkulName}</span>
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded uppercase font-bold">{req.matkulCode}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="px-6 py-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Perubahan yang diajukan:</h3>
                  <div className="space-y-2 mb-4">
                    <DiffBadge label="Nama" from={req.matkulName} to={req.proposedName} />
                    <DiffBadge label="Kode" from={req.matkulCode} to={req.proposedCode} />
                    <DiffBadge label="SKS" from={String(req.currentSks)} to={req.proposedSks !== null ? String(req.proposedSks) : null} />
                  </div>
                  {req.reason && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                      <strong className="text-gray-500 text-xs uppercase tracking-wider block mb-1">Alasan:</strong>
                      {req.reason}
                    </div>
                  )}
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    onClick={() => handleDecision(req.id, 'reject')}
                    disabled={isSaving === req.id}
                    className="inline-flex items-center px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle size={15} className="mr-1.5" /> Tolak
                  </button>
                  <button
                    onClick={() => handleDecision(req.id, 'approve')}
                    disabled={isSaving === req.id}
                    className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle size={15} className="mr-1.5" /> {isSaving === req.id ? 'Memproses...' : 'Setujui & Terapkan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center mb-8">
          <Bell size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">Tidak ada permintaan yang menunggu keputusan.</p>
        </div>
      )}

      {/* Decided Requests */}
      {decided.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Riwayat Keputusan</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
            {decided.map(req => (
              <div key={req.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-800">{req.matkulName}</span>
                  <span className="ml-2 text-xs text-gray-400 uppercase">{req.matkulCode}</span>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {req.status === 'APPROVED' ? '✓ Disetujui' : '✕ Ditolak'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
