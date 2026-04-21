import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { DocType } from '@prisma/client';

const DOC_TYPES: DocType[] = [
  'RPS', 'SOAL_UTS', 'SOAL_UAS', 'LPP', 'EPP', 'BERITA_ACARA',
];


// GET /api/matkul/[id]/documents?semesterId=XXXX
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matkulId } = await params;
  const { searchParams } = new URL(req.url);
  const semesterId = searchParams.get('semesterId');
  if (!semesterId) return NextResponse.json({ error: 'semesterId required' }, { status: 400 });

  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const matkul = await prisma.matkul.findUnique({
    where: { id: matkulId },
    include: {
      dosens: { select: { id: true, name: true } },
      koordinators: { select: { id: true } },
    },
  });
  if (!matkul) return NextResponse.json({ error: 'Matkul not found' }, { status: 404 });

  const isKaprodi = roles.includes('KAPRODI');
  const isKoordinator = roles.includes('KOORDINATOR') && matkul.koordinators.some(k => k.id === userId);
  const isProdi = roles.includes('PRODI');
  const isDosen = matkul.dosens.some(d => d.id === userId);

  const isReviewer = isKaprodi || isKoordinator || isProdi;

  if (!isReviewer && !isDosen) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (isReviewer) {
    // Reviewer scope: all docs for this matkul, grouped by type
    const docs = await prisma.academicDocument.findMany({
      where: { matkulId, semesterId },
      include: { dosen: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    // All reviewers see all doc types
    const reviewerDocTypes = DOC_TYPES;

    // Build sections grouped by type; include all assigned dosens (even UNSUBMITTED)
    const sections = reviewerDocTypes.map(type => {
      const typeDocs = docs.filter(d => d.type === type);
      const dosenRows = matkul.dosens.map(dosen => {
        const doc = typeDocs.find(d => d.dosenId === dosen.id);
        if (doc) return doc;
        return {
          id: null,
          dosenId: dosen.id,
          dosen: { id: dosen.id, name: dosen.name },
          status: 'UNSUBMITTED' as const,
          isKoordinatorApproved: false,
          isProdiApproved: false,
          type,
          semesterId,
          matkulId,
          fileUrl: null,
          fileName: null,
          annotatedPdfUrl: null,
          koordinatorNotes: null,
          kaprodiNotes: null,
          prodiNotes: null,
          koordinatorId: null,
          koordinatorSignedPdfUrl: null,
          finalPdfUrl: null,
          createdAt: null,
          updatedAt: null,
        };
      });
      return { type, docs: dosenRows };
    });

    return NextResponse.json({ role: 'reviewer', sections });
  }

  // Dosen scope: own docs only
  const docs = await prisma.academicDocument.findMany({
    where: { matkulId, dosenId: userId, semesterId },
  });

  const sections = DOC_TYPES.map(type => {
    const doc = docs.find(d => d.type === type) ?? null;
    return { type, doc };
  });

  return NextResponse.json({ role: 'dosen', sections });
}
