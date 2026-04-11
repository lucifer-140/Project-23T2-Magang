import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import type { RpsApiResponse, MatkulRps } from '@/lib/api-types';

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value ?? '';
  const roleRaw = cookieStore.get('userRole')?.value;

  let roles: string[] = [];
  try {
    if (roleRaw) {
      const decoded = decodeURIComponent(roleRaw);
      const parsed = JSON.parse(decoded);
      roles = Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch (e) {
    roles = roleRaw ? [roleRaw] : [];
  }

  // ── DOSEN branch ────────────────────────────────────────────────────────────
  // Only return DOSEN view if user is pure DOSEN (no reviewer roles)
  // OR has DOSEN + KOORDINATOR but NOT KAPRODI
  if (roles.includes('DOSEN') && !roles.includes('KAPRODI') && !roles.includes('KOORDINATOR')) {
    const assignedMatkuls = await prisma.matkul.findMany({
      where: { dosens: { some: { id: userId } } },
      include: {
        rps: {
          where: { dosenId: userId },
          select: {
            id: true,
            status: true,
            isKoordinatorApproved: true,
            fileName: true,
            fileUrl: true,
            finalPdfUrl: true,
            notes: true,
            koordinatorNotes: true,
            kaprodiNotes: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { code: 'asc' },
    });

    const matkulRpsData: MatkulRps[] = assignedMatkuls.map((m) => ({
      matkulId: m.id,
      matkulCode: m.code,
      matkulName: m.name,
      sks: m.sks,
      rpsId: m.rps[0]?.id ?? null,
      status: m.rps[0]?.status ?? 'UNSUBMITTED',
      isKoordinatorApproved: m.rps[0]?.isKoordinatorApproved ?? false,
      fileName: m.rps[0]?.fileName ?? null,
      fileUrl: m.rps[0]?.fileUrl ?? null,
      finalPdfUrl: m.rps[0]?.finalPdfUrl ?? null,
      notes: m.rps[0]?.notes ?? null,
      koordinatorNotes: m.rps[0]?.koordinatorNotes ?? null,
      kaprodiNotes: m.rps[0]?.kaprodiNotes ?? null,
      updatedAt: m.rps[0]?.updatedAt?.toISOString() ?? null,
    }));

    return NextResponse.json(matkulRpsData);
  }

  // ── KOORDINATOR branch ───────────────────────────────────────────────────────
  if (roles.includes('KOORDINATOR') && !roles.includes('KAPRODI')) {
    const [submissions, matkulsWithDosens] = await Promise.all([
      prisma.rPS.findMany({
        where: {
          matkul: {
            koordinators: { some: { id: userId } },
          },
        },
        include: {
          matkul: { select: { name: true, code: true } },
          dosen: { select: { name: true } },
          koordinator: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.matkul.findMany({
        where: {
          koordinators: { some: { id: userId } },
        },
        include: {
          dosens: { select: { id: true, name: true } },
          rps: true,
        },
      }),
    ]);

    const assignments = matkulsWithDosens.flatMap((m) =>
      m.dosens.map((d) => {
        const rps = m.rps.find((r) => r.dosenId === d.id);
        return {
          dosenName: d.name,
          matkulName: m.name,
          rpsId: rps?.id ?? null,
          defaultStatus: rps?.status ?? 'UNSUBMITTED',
        };
      })
    );

    const payload: RpsApiResponse = {
      submissions: submissions.map((s) => ({
        id: s.id,
        matkulName: s.matkul.name,
        matkulCode: s.matkul.code,
        dosenName: s.dosen.name,
        koordinatorName: s.koordinator?.name ?? null,
        status: s.status,
        isKoordinatorApproved: s.isKoordinatorApproved,
        fileName: s.fileName,
        fileUrl: s.fileUrl,
        koordinatorNotes: s.koordinatorNotes,
        kaprodiNotes: s.kaprodiNotes,
        koordinatorSignedPdfUrl: s.koordinatorSignedPdfUrl,
        finalPdfUrl: s.finalPdfUrl,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
      assignments,
    };

    return NextResponse.json(payload);
  }

  // ── KAPRODI branch (default) ─────────────────────────────────────────────────
  const [submissions, dosensWithMatkuls] = await Promise.all([
    prisma.rPS.findMany({
      include: {
        matkul: { select: { name: true, code: true, sks: true } },
        dosen: { select: { name: true } },
        koordinator: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { dosenMatkuls: { some: {} } },
      include: {
        dosenMatkuls: {
          include: { rps: true },
        },
      },
    }),
  ]);

  const assignments: RpsApiResponse['assignments'] = [];
  dosensWithMatkuls.forEach((d) => {
    d.dosenMatkuls.forEach((m) => {
      const rpsForDosen = m.rps.find((r) => r.dosenId === d.id);
      assignments.push({
        dosenName: d.name,
        matkulName: m.name,
        rpsId: rpsForDosen?.id ?? null,
        defaultStatus: rpsForDosen?.status ?? 'UNSUBMITTED',
        isKoordinatorApproved: rpsForDosen?.isKoordinatorApproved ?? false,
      });
    });
  });

  const payload: RpsApiResponse = {
    submissions: submissions.map((s) => ({
      id: s.id,
      matkulName: s.matkul.name,
      matkulCode: s.matkul.code,
      dosenName: s.dosen.name,
      koordinatorName: s.koordinator?.name ?? null,
      status: s.status,
      isKoordinatorApproved: s.isKoordinatorApproved,
      fileName: s.fileName,
      fileUrl: s.fileUrl,
      koordinatorNotes: s.koordinatorNotes,
      kaprodiNotes: s.kaprodiNotes,
      koordinatorSignedPdfUrl: s.koordinatorSignedPdfUrl,
      finalPdfUrl: s.finalPdfUrl,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    assignments,
  };

  return NextResponse.json(payload);
}
