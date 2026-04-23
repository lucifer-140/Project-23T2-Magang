import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import {
  FileText, CheckCircle, Clock, AlertCircle, Users, Bookmark,
  BookOpen, CalendarDays, ChevronRight, Shield,
} from 'lucide-react';
import Link from 'next/link';

const docTypeLabel: Record<string, string> = {
  RPS: 'RPS', SOAL_UTS: 'Soal UTS', SOAL_UAS: 'Soal UAS',
  LPP: 'LPP', EPP: 'EPP', BERITA_ACARA: 'Berita Acara',
};
const statusStyle: Record<string, string> = {
  UNSUBMITTED: 'bg-gray-100 text-gray-600',
  SUBMITTED:   'bg-yellow-100 text-yellow-700',
  PENGECEKAN:  'bg-blue-100 text-blue-700',
  REVISION:    'bg-red-100 text-red-700',
  APPROVED:    'bg-green-100 text-green-700',
};
const statusLabel: Record<string, string> = {
  UNSUBMITTED: 'Belum Upload', SUBMITTED: 'Dikirim',
  PENGECEKAN: 'Pengecekan', REVISION: 'Revisi', APPROVED: 'Disetujui',
};

export default async function DosenDashboard() {
  const cookieStore = await cookies();
  const userId   = cookieStore.get('userId')?.value;
  const roleStr  = cookieStore.get('userRole')?.value;
  const userName = cookieStore.get('userName')?.value ?? '';

  let decodedRoleStr = roleStr || '';
  try { decodedRoleStr = decodeURIComponent(decodedRoleStr); } catch (_) {}

  let roles: string[] = [];
  try {
    const parsed = JSON.parse(decodedRoleStr || '[]');
    roles = Array.isArray(parsed) ? parsed : [parsed];
  } catch (_) {
    roles = [decodedRoleStr || ''];
  }

  // ── DOSEN stats ──────────────────────────────────────────────────────────
  const [totalMatkul, unsubmitted, inProgress, revision, approved] = userId
    ? await Promise.all([
        prisma.matkul.count({ where: { dosens: { some: { id: userId } } } }),
        prisma.academicDocument.count({ where: { dosenId: userId, status: 'UNSUBMITTED' } }),
        prisma.academicDocument.count({ where: { dosenId: userId, status: { in: ['SUBMITTED', 'PENGECEKAN'] } } }),
        prisma.academicDocument.count({ where: { dosenId: userId, status: 'REVISION' } }),
        prisma.academicDocument.count({ where: { dosenId: userId, status: 'APPROVED' } }),
      ])
    : [0, 0, 0, 0, 0];

  const recentRevisions = userId
    ? await prisma.academicDocument.findMany({
        where: { dosenId: userId, status: 'REVISION' },
        include: { matkul: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      })
    : [];

  // ── KOORDINATOR stats ────────────────────────────────────────────────────
  let koordStats = { matkuls: 0, dosens: 0, pendingReview: 0, revision: 0, approved: 0 };
  if (roles.includes('KOORDINATOR') && userId) {
    const coordMatkuls = await prisma.matkul.findMany({
      where: { koordinators: { some: { id: userId } } },
      include: { dosens: { select: { id: true } } },
    });
    const dosensSet = new Set(coordMatkuls.flatMap(m => m.dosens.map(d => d.id)));
    const [kPending, kRevision, kApproved] = await Promise.all([
      prisma.academicDocument.count({ where: { matkul: { koordinators: { some: { id: userId } } }, status: 'SUBMITTED' } }),
      prisma.academicDocument.count({ where: { matkul: { koordinators: { some: { id: userId } } }, status: 'REVISION' } }),
      prisma.academicDocument.count({ where: { matkul: { koordinators: { some: { id: userId } } }, isKoordinatorApproved: true } }),
    ]);
    koordStats = { matkuls: coordMatkuls.length, dosens: dosensSet.size, pendingReview: kPending, revision: kRevision, approved: kApproved };
  }

  const firstName = userName.split(' ')[0];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-playfair font-bold text-uph-blue mb-1">
          {firstName ? `Selamat Datang, ${firstName}` : 'Selamat Datang'}
        </h1>
        <p className="text-gray-500">Pantau status akademik dan tugas Anda di portal ini.</p>
      </div>

      {/* ─── DOSEN SECTION ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="text-uph-blue" size={18} />
          <h2 className="text-lg font-bold text-gray-800">Tugas Dosen</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">
          {[
            { label: 'Total Matkul', value: totalMatkul, color: 'border-l-uph-blue',   icon: <BookOpen    size={15} className="text-uph-blue opacity-50"   /> },
            { label: 'Belum Upload', value: unsubmitted, color: 'border-l-gray-400',   icon: <FileText    size={15} className="text-gray-400 opacity-50"   /> },
            { label: 'Dalam Proses', value: inProgress,  color: 'border-l-yellow-500', icon: <Clock       size={15} className="text-yellow-500 opacity-50" /> },
            { label: 'Perlu Revisi', value: revision,    color: 'border-l-red-400',    icon: <AlertCircle size={15} className="text-red-400 opacity-50"    /> },
            { label: 'Disetujui',    value: approved,    color: 'border-l-green-500',  icon: <CheckCircle size={15} className="text-green-500 opacity-50"  /> },
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <Link href="/dashboard/matkul" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-uph-blue hover:shadow-md transition-all flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-uph-blue/10 flex items-center justify-center group-hover:bg-uph-blue/20 transition-colors shrink-0">
              <BookOpen size={22} className="text-uph-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800">Mata Kuliah Saya</p>
              <p className="text-sm text-gray-500">Lihat dan upload dokumen akademik</p>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-uph-blue transition-colors" />
          </Link>
          <Link href="/dashboard/berita-acara" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors shrink-0">
              <CalendarDays size={22} className="text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800">Berita Acara Perwalian</p>
              <p className="text-sm text-gray-500">Kelola absensi dan berita acara kelas</p>
            </div>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-teal-600 transition-colors" />
          </Link>
        </div>

        {recentRevisions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-red-400" />
                <h3 className="font-bold text-gray-800 text-sm">Perlu Tindakan — Revisi</h3>
              </div>
              <Link href="/dashboard/matkul" className="text-xs text-uph-blue font-semibold hover:underline">Lihat Semua</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentRevisions.map(doc => (
                <div key={doc.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{doc.matkul.name}</p>
                    <p className="text-xs text-gray-500">{docTypeLabel[doc.type] ?? doc.type}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle[doc.status]}`}>
                    {statusLabel[doc.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ─── KOORDINATOR SECTION ──────────────────────────────────────────── */}
      {roles.includes('KOORDINATOR') && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-uph-blue" size={18} />
            <h2 className="text-lg font-bold text-gray-800">Koordinator</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            {[
              { label: 'Matkul',       value: koordStats.matkuls,      color: 'border-l-uph-blue'   },
              { label: 'Dosen',        value: koordStats.dosens,       color: 'border-l-teal-500'   },
              { label: 'Perlu Review', value: koordStats.pendingReview, color: 'border-l-yellow-500' },
              { label: 'Revisi',       value: koordStats.revision,     color: 'border-l-red-400'    },
              { label: 'Disetujui',    value: koordStats.approved,     color: 'border-l-green-500'  },
            ].map(s => (
              <div key={s.label} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 ${s.color}`}>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{s.label}</span>
                <p className="text-3xl font-playfair font-bold text-uph-blue">{s.value}</p>
              </div>
            ))}
          </div>

          <Link href="/dashboard/matkul" className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-uph-blue hover:shadow-md transition-all flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-uph-blue/10 flex items-center justify-center group-hover:bg-uph-blue/20 transition-colors shrink-0">
              <FileText size={22} className="text-uph-blue" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">Review Dokumen Akademik</p>
              <p className="text-sm text-gray-500">Periksa dan setujui dokumen dosen di matkul Anda</p>
            </div>
            {koordStats.pendingReview > 0 && (
              <span className="text-xs font-bold bg-uph-blue text-white px-2 py-0.5 rounded-full">{koordStats.pendingReview} menunggu</span>
            )}
            <ChevronRight size={16} className="text-gray-400 group-hover:text-uph-blue transition-colors" />
          </Link>
        </section>
      )}

    </div>
  );
}
