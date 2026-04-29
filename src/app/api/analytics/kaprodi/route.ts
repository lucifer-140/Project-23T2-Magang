import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const semesterId = searchParams.get('semesterId'); // null = all semesters

  const semesterFilter = semesterId ? { semesterId } : {};

  // All semesters for dropdown
  const semesters = await prisma.semester.findMany({
    include: { tahunAkademik: { select: { tahun: true } } },
    orderBy: [{ tahunAkademik: { tahun: 'desc' } }, { nama: 'asc' }],
  });

  // Doc counts by status
  const [needsReview, approved, revision, pengecekan, totalDocs] = await Promise.all([
    prisma.academicDocument.count({ where: { ...semesterFilter, status: 'SUBMITTED' } }),
    prisma.academicDocument.count({ where: { ...semesterFilter, status: 'APPROVED' } }),
    prisma.academicDocument.count({ where: { ...semesterFilter, status: 'REVISION' } }),
    prisma.academicDocument.count({ where: { ...semesterFilter, status: 'PENGECEKAN' } }),
    prisma.academicDocument.count({ where: semesterFilter }),
  ]);

  // Doc counts by type + status (for stacked bar chart)
  const docTypes = ['RPS', 'SOAL_UTS', 'SOAL_UAS', 'LPP', 'EPP_UTS', 'EPP_UAS', 'BERITA_ACARA'] as const;
  const statuses = ['APPROVED', 'SUBMITTED', 'REVISION', 'PENGECEKAN', 'UNSUBMITTED'] as const;

  const typeBreakdownRaw = await prisma.academicDocument.groupBy({
    by: ['type', 'status'],
    where: semesterFilter,
    _count: { id: true },
  });

  // Only include types that have at least one doc
  const typesWithData = new Set(typeBreakdownRaw.map(r => r.type));
  const typeBreakdown = Array.from(typesWithData).map(type => {
    const row: Record<string, string | number> = { type };
    for (const status of statuses) {
      const match = typeBreakdownRaw.find(r => r.type === type && r.status === status);
      row[status] = match?._count.id ?? 0;
    }
    return row;
  });

  // Average EPP metric scores across all approved EPP docs (null = no EPP data yet)
  // EPP averages
  const eppDocs = await prisma.academicDocument.findMany({
    where: {
      ...semesterFilter,
      type: { in: ['EPP_UTS', 'EPP_UAS'] },
      eppPersentaseMateri: { not: null },
    },
    select: {
      eppPersentaseMateri: true,
      eppPersentaseCpmk: true,
      eppPersentaseKehadiran: true,
      eppPersentaseNilaiB: true,
      eppPersentaseKkmToB: true,
    },
  });

  const eppMetrics =
    eppDocs.length === 0
      ? null
      : {
          count: eppDocs.length,
          eppPersentaseMateri: avg(eppDocs.map(d => d.eppPersentaseMateri)),
          eppPersentaseCpmk: avg(eppDocs.map(d => d.eppPersentaseCpmk)),
          eppPersentaseKehadiran: avg(eppDocs.map(d => d.eppPersentaseKehadiran)),
          eppPersentaseNilaiB: avg(eppDocs.map(d => d.eppPersentaseNilaiB)),
          eppPersentaseKkmToB: avg(eppDocs.map(d => d.eppPersentaseKkmToB)),
        };

  return NextResponse.json({
    semesters: semesters.map(s => ({
      id: s.id,
      label: `${s.nama} ${s.tahunAkademik.tahun}`,
    })),
    stats: { needsReview, approved, revision, pengecekan, totalDocs },
    typeBreakdown,
    eppMetrics,
  });
}

function avg(vals: (number | null)[]): number {
  const filtered = vals.filter((v): v is number => v !== null);
  if (filtered.length === 0) return 0;
  return Math.round(filtered.reduce((a, b) => a + b, 0) / filtered.length);
}
