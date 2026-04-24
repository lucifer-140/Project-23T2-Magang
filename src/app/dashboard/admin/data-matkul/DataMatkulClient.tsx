'use client';

import { useState, useMemo } from 'react';
import { Pencil, X, Search } from 'lucide-react';

type MatkulRow = {
  id: string;
  code: string;
  name: string;
  sks: number;
  semesterCount: number;
};

type ChangeForm = {
  proposedName: string;
  proposedCode: string;
  proposedSks: string;
  reason: string;
};

const EMPTY_FORM: ChangeForm = { proposedName: '', proposedCode: '', proposedSks: '', reason: '' };

export default function DataMatkulClient({ matkuls }: { matkuls: MatkulRow[] }) {
  const [search, setSearch] = useState('');
  const [changingMatkul, setChangingMatkul] = useState<MatkulRow | null>(null);
  const [changeForm, setChangeForm] = useState<ChangeForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return matkuls.filter(m =>
      m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
    );
  }, [matkuls, search]);

  function openModal(m: MatkulRow) {
    setChangingMatkul(m);
    setChangeForm({ proposedName: m.name, proposedCode: m.code, proposedSks: String(m.sks), reason: '' });
  }

  function closeModal() {
    setChangingMatkul(null);
    setChangeForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!changingMatkul) return;
    setIsSubmitting(true);
    await fetch(`/api/katalog/${changingMatkul.id}/change-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changeForm),
    });
    setIsSubmitting(false);
    closeModal();
    alert('Permintaan perubahan telah dikirim ke Kaprodi untuk di-review.');
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-playfair font-bold text-uph-blue">Data Mata Kuliah</h1>
        <p className="text-sm text-gray-500 mt-1">
          Katalog semua mata kuliah. Perubahan disetujui Kaprodi dan berlaku di seluruh semester.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau kode..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-uph-blue"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-uph-border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-uph-border text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-3 text-left">Kode</th>
              <th className="px-4 py-3 text-left">Nama</th>
              <th className="px-4 py-3 text-center">SKS</th>
              <th className="px-4 py-3 text-center">Digunakan</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Tidak ada matkul ditemukan.
                </td>
              </tr>
            ) : (
              filtered.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{m.code}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{m.sks}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-gray-500">{m.semesterCount} semester</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openModal(m)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-yellow-400 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors"
                    >
                      <Pencil size={12} />
                      Edit Data
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} dari {matkuls.length} mata kuliah unik
        </div>
      </div>

      {/* Change Request Modal */}
      {changingMatkul && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-yellow-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Ajukan Perubahan Data</h2>
                <p className="text-sm text-yellow-700 font-medium">
                  Perlu persetujuan Kaprodi · berlaku di {changingMatkul.semesterCount} semester
                </p>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-yellow-200 rounded-full">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
                <strong>Data saat ini:</strong> {changingMatkul.code} - {changingMatkul.name} ({changingMatkul.sks} SKS)
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nama Baru (opsional)
                </label>
                <input
                  value={changeForm.proposedName}
                  onChange={e => setChangeForm(p => ({ ...p, proposedName: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Kode Baru (opsional)
                </label>
                <input
                  value={changeForm.proposedCode}
                  onChange={e => setChangeForm(p => ({ ...p, proposedCode: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  SKS Baru (opsional)
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={changeForm.proposedSks}
                  onChange={e => setChangeForm(p => ({ ...p, proposedSks: e.target.value }))}
                  placeholder="Kosongkan jika tidak berubah"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Alasan Perubahan *
                </label>
                <textarea
                  required
                  value={changeForm.reason}
                  onChange={e => setChangeForm(p => ({ ...p, reason: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-500 min-h-[80px] resize-none"
                  placeholder="Jelaskan alasan perubahan ini..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-yellow-500 text-white text-sm font-bold rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Permintaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
