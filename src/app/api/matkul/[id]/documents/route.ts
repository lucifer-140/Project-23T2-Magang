import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { DocType } from '@prisma/client';

const DOC_TYPES: DocType[] = [
  'RPS', 'SOAL_UTS', 'SOAL_UAS', 'LPP', 'EPP_UTS', 'EPP_UAS', 'BERITA_ACARA',
];


// GET /api/matkul/[id]/documents?semesterId=XXXX
// [id] = katalogId (or legacy matkulId). Resolves the correct Matkul instance via katalogMatkulId + semesterId.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const semesterId = searchParams.get('semesterId');
  if (!semesterId) return NextResponse.json({ error: 'semesterId required' }, { status: 400 });

  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  // Resolve matkulId: try katalog lookup first, then legacy direct lookup
  const byKatalog = await prisma.matkul.findFirst({ where: { katalogMatkulId: id, semesterId } });
  const matkulId = byKatalog ? byKatalog.id : id;

  const matkul = await prisma.matkul.findUnique({
    where: { id: matkulId },
    include: {
      dosens: { select: { id: true, name: true } },
      koordinators: { select: { id: true } },
      classes: {
        include: { dosens: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
      },
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
    // Reviewer scope: all docs for this matkul, grouped by class then type
    const docs = await prisma.academicDocument.findMany({
      where: { matkulId, semesterId },
      include: {
        dosen: { select: { id: true, name: true } },
        matkulClass: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Group by class: one section-set per class
    const classSections = matkul.classes.map(cls => {
      const sections = DOC_TYPES.map(type => {
        const typeDocs = docs.filter(d => d.type === type && d.matkulClassId === cls.id);
        const dosenRows = cls.dosens.map(dosen => {
          const doc = typeDocs.find(d => d.dosenId === dosen.id);
          if (doc) return doc;
          return {
            id: null,
            dosenId: dosen.id,
            dosen: { id: dosen.id, name: dosen.name },
            matkulClassId: cls.id,
            matkulClass: { id: cls.id, name: cls.name },
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
      return { classId: cls.id, className: cls.name, sections };
    });

    return NextResponse.json({ role: 'reviewer', classSections });
  }

  // Dosen scope: own docs per class
  const myClasses = matkul.classes.filter(cls => cls.dosens.some(d => d.id === userId));

  const docs = await prisma.academicDocument.findMany({
    where: { matkulId, dosenId: userId, semesterId },
    include: { matkulClass: { select: { id: true, name: true } } },
  });

  const classSections = myClasses.map(cls => {
    const sections = DOC_TYPES.map(type => {
      const doc = docs.find(d => d.type === type && d.matkulClassId === cls.id) ?? null;
      return { type, doc };
    });
    return { classId: cls.id, className: cls.name, sections };
  });

  return NextResponse.json({ role: 'dosen', classSections });
}
