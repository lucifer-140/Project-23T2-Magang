import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import {
  FileText, CheckCircle, Clock, AlertCircle, Users, Bookmark,
  BookOpen, CalendarDays, ChevronRight, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import AutoRefresh from '@/components/AutoRefresh';

const DOC_LABEL: Record<string, string> = {
  RPS: 'RPS', SOAL_UTS: 'Soal UTS', SOAL_UAS: 'Soal UAS',
  LPP: 'LPP', EPP: 'EPP', EPP_UTS: 'EPP UTS', EPP_UAS: 'EPP UAS', BERITA_ACARA: 'Berita Acara',
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j lalu`;
  return `${Math.floor(h / 24)}h lalu`;
}

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

  const totalDocs = unsubmitted + inProgress + revision + approved;
  const progressPct = totalDocs > 0 ? Math.round((approved / totalDocs) * 100) : 0;

  // Revision list with reviewer attribution
  const recentRevisions = userId
    ? await prisma.academicDocument.findMany({
        where: { dosenId: userId, status: 'REVISION' },
        include: { matkul: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      })
    : [];

  // ── KOORDINATOR data ─────────────────────────────────────────────────────
  let koordStats = { matkuls: 0, dosens: 0, pendingReview: 0 };
  let pendingReviewDocs: Array<{
    id: string;
    type: string;
    matkul: { id: string; name: string; code: string };
    dosen: { name: string };
    updatedAt: Date;
  }> = [];

  if (roles.includes('KOORDINATOR') && userId) {
    const coordMatkuls = await prisma.matkul.findMany({
      where: { koordinators: { some: { id: userId } } },
      include: { dosens: { select: { id: true } } },
    });
    const dosensSet = new Set(coordMatkuls.flatMap(m => m.dosens.map(d => d.id)));

    const kPending = await prisma.academicDocument.count({
      where: { matkul: { koordinators: { some: { id: userId } } }, status: 'SUBMITTED' },
    });

    koordStats = { matkuls: coordMatkuls.length, dosens: dosensSet.size, pendingReview: kPending };

    pendingReviewDocs = await prisma.academicDocument.findMany({
      where: {
        matkul: { koordinators: { some: { id: userId } } },
        status: 'SUBMITTED',
        isKoordinatorApproved: false,
      },
      include: {
        matkul: { select: { id: true, name: true, code: true } },
        dosen: { select: { name: true } },
      },
      orderBy: { updatedAt: 'asc' },
      take: 5,
    });
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

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
          {[
            { label: 'Total Matkul', value: totalMatkul, color: 'border-l-uph-blue',   icon: <BookOpen    size={15} className="text-uph-blue opacity-50"   />, href: null },
            { label: 'Belum Upload', value: unsubmitted, color: 'border-l-gray-400',   icon: <FileText    size={15} className="text-gray-400 opacity-50"   />, href: '/dashboard/matkul' },
            { label: 'Dalam Proses', value: inProgress,  color: 'border-l-yellow-500', icon: <Clock       size={15} className="text-yellow-500 opacity-50" />, href: null },
            { label: 'Perlu Revisi', value: revision,    color: 'border-l-red-400',    icon: <AlertCircle size={15} className="text-red-400 opacity-50"    />, href: '#revisi' },
            { label: 'Disetujui',    value: approved,    color: 'border-l-green-500',  icon: <CheckCircle size={15} className="text-green-500 opacity-50"  />, href: null },
          ].map(s => {
            const inner = (
              <div className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 border-l-4 ${s.color} h-full`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">{s.label}</span>
                  {s.icon}
                </div>
                <p className="text-3xl font-playfair font-bold text-uph-blue">{s.value}</p>
                {/* progress bar on Disetujui card */}
                {s.label === 'Disetujui' && totalDocs > 0 && (
                  <div className="mt-2">
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{progressPct}% selesai</p>
                  </div>
                )}
              </div>
            );
            return s.href
              ? <a key={s.label} href={s.href} className="block hover:opacity-90 transition-opacity">{inner}</a>
              : <div key={s.label}>{inner}</div>;
          })}
        </div>

        {/* Quick nav */}
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

        {/* Revision list — improved with links + reviewer attribution */}
        {recentRevisions.length > 0 && (
          <div id="revisi" className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-100 flex items-center justify-between bg-red-50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="text-red-500" />
                <h3 className="font-bold text-gray-900 text-sm">Perlu Tindakan: Revisi</h3>
                <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">{recentRevisions.length}</span>
              </div>
              <Link href="/dashboard/matkul" className="flex items-center gap-1 text-xs font-bold text-uph-blue hover:underline">
                Lihat Semua <ArrowRight size={11} />
              </Link>
            </div>
            <div className="divide-y divide-red-50">
              {recentRevisions.map(doc => {
                const reviewerLabel = doc.kaprodiNotes ? 'Kaprodi' : doc.prodiNotes ? 'PRODI' : doc.koordinatorNotes ? 'Koordinator' : null;
                const note = doc.kaprodiNotes ?? doc.prodiNotes ?? doc.koordinatorNotes;
                return (
                  <Link
                    key={doc.id}
                    href={`/dashboard/matkul/${doc.matkulId}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-red-50/60 transition-colors group"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">{doc.matkul.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="font-semibold text-gray-700">{DOC_LABEL[doc.type] ?? doc.type}</span>
                          {reviewerLabel && <span className="ml-1.5 text-red-500 font-medium">Dikembalikan oleh {reviewerLabel}</span>}
                        </p>
                        {note && (
                          <p className="text-xs text-red-600 mt-1 italic truncate max-w-sm">"{note}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-uph-blue flex-shrink-0 ml-3 group-hover:underline">
                      Buka <ArrowRight size={12} />
                    </div>
                  </Link>
                );
              })}
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

          {/* Compact 3-stat row */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Matkul Diampu',  value: koordStats.matkuls,      color: 'border-l-uph-blue',   text: 'text-uph-blue' },
              { label: 'Perlu Review',   value: koordStats.pendingReview, color: 'border-l-yellow-500', text: 'text-yellow-600' },
              { label: 'Dosen Dikelola', value: koordStats.dosens,        color: 'border-l-teal-500',   text: 'text-teal-600' },
            ].map(s => (
              <div key={s.label} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 ${s.color}`}>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{s.label}</span>
                <p className={`text-3xl font-playfair font-bold ${s.text}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Pending review list */}
          {pendingReviewDocs.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-amber-100">
              <div className="px-6 py-4 border-b border-amber-50 flex items-center justify-between bg-amber-50/40 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-amber-500" />
                  <h3 className="font-bold text-gray-800 text-sm">Menunggu Review Anda</h3>
                  <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">{koordStats.pendingReview}</span>
                </div>
                {koordStats.pendingReview > 5 && (
                  <Link href="/dashboard/matkul" className="text-xs text-uph-blue font-semibold hover:underline">
                    Lihat semua ({koordStats.pendingReview})
                  </Link>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {pendingReviewDocs.map(doc => (
                  <Link
                    key={doc.id}
                    href={`/dashboard/matkul/${doc.matkul.id}`}
                    className="flex items-center justify-between px-6 py-3.5 hover:bg-amber-50/30 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{doc.matkul.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {doc.dosen.name} · <span className="font-medium">{DOC_LABEL[doc.type] ?? doc.type}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[10px] text-gray-400">{timeAgo(doc.updatedAt)}</span>
                      <span className="text-xs font-bold text-uph-blue group-hover:underline flex items-center gap-1">
                        Review <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-8 text-center">
              <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-600">Semua dokumen sudah diproses</p>
              <p className="text-xs text-gray-400 mt-0.5">Tidak ada dokumen yang menunggu review Anda</p>
            </div>
          )}
        </section>
      )}
      <AutoRefresh />
    </div>
  );
}
