"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Lock, Unlock, Loader2 } from 'lucide-react';

const SEMESTERS = ['Ganjil', 'Genap', 'Akselerasi'] as const;

type SemesterItem = {
  id: string;
  nama: string;
  isActive: boolean;
  _count: { matkuls: number };
};

type TahunAkademik = {
  id: string;
  tahun: string;
  isActive: boolean;
  semesters: SemesterItem[];
};

type Props = { tahun: TahunAkademik };

export function TahunDetailClient({ tahun: initial }: Props) {
  const router = useRouter();
  const [semesters, setSemesters] = useState(initial.semesters);
  const [toggling, setToggling] = useState<string | null>(null);

  async function handleToggle(semester: SemesterItem) {
    setToggling(semester.id);
    try {
      const res = await fetch(`/api/tahun-akademik/${initial.id}/semesters/${semester.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !semester.isActive }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? 'Gagal mengubah status semester.'); return; }
      setSemesters(prev => prev.map(s => s.id === semester.id ? { ...s, isActive: data.isActive } : s));
    } catch {
      alert('Gagal terhubung ke server.');
    } finally {
      setToggling(null);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => router.push('/dashboard/admin/matkul')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-uph-blue transition-colors font-medium">
          <ArrowLeft size={15} /> Semua Tahun
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">TA {initial.tahun}</h1>
        <p className="text-gray-500">Pilih semester untuk mengelola mata kuliah. Aktifkan semester agar Kaprodi dapat membuka akses BAP.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SEMESTERS.map(sem => {
          const existing = semesters.find(s => s.nama === sem);
          if (!existing) {
            return (
              <div key={sem} className="rounded-2xl border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center gap-2 text-gray-400">
                <span className="font-semibold">{sem}</span>
                <span className="text-xs">Belum tersedia</span>
              </div>
            );
          }
          const isToggling = toggling === existing.id;
          return (
            <div key={sem} className="rounded-2xl border-2 border-uph-blue/20 p-6 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-lg text-gray-800">{sem}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{existing._count.matkuls} mata kuliah</p>
                </div>
                {existing.isActive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    <Unlock size={10} /> AKTIF
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    <Lock size={10} /> TERKUNCI
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => existing.isActive && router.push(`/dashboard/admin/matkul/${initial.id}/${existing.id}`)}
                  disabled={!existing.isActive}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg transition-colors ${
                    existing.isActive
                      ? 'text-uph-blue border-uph-blue/30 hover:bg-uph-blue/5'
                      : 'text-gray-300 border-gray-200 cursor-not-allowed'
                  }`}>
                  <ChevronRight size={12} /> Kelola Matkul
                </button>
                <button
                  onClick={() => handleToggle(existing)}
                  disabled={isToggling}
                  className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 ${
                    existing.isActive
                      ? 'text-gray-600 border border-gray-300 hover:bg-gray-50'
                      : 'text-white bg-uph-blue hover:bg-[#111c33]'
                  }`}>
                  {isToggling ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : existing.isActive ? (
                    <><Lock size={12} /> Kunci</>
                  ) : (
                    <><Unlock size={12} /> Aktifkan</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
