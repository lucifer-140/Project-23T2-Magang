import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { createNotification, notifyRole } from '@/lib/notifications';
import { DocType, Role } from '@prisma/client';

const DOC_LABEL: Record<DocType, string> = {
  RPS: 'RPS',
  SOAL_UTS: 'Soal UTS',
  SOAL_UAS: 'Soal UAS',
  LPP: 'Laporan Pelaksanaan Pembelajaran',
  EPP: 'Evaluasi Pencapaian Program',
  BERITA_ACARA: 'Berita Acara Perwalian',
};

// PATCH /api/documents/[docId]/review
// Body: { reviewer: 'koordinator' | 'prodi' | 'kaprodi', action: 'approve' | 'reject', notes?: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const { reviewer, action, notes } = await req.json();

  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  const existingDoc = await prisma.academicDocument.findUnique({
    where: { id: docId },
    select: {
      isKoordinatorApproved: true,
      isProdiApproved: true,
      dosenId: true,
      matkulId: true,
      type: true,
    },
  });
  if (!existingDoc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  let updateData: Record<string, unknown>;

  if (reviewer === 'koordinator') {
    if (action === 'approve') {
      updateData = {
        isKoordinatorApproved: true,
        koordinatorId: userId ?? null,
        status: 'PENGECEKAN',
        koordinatorNotes: null,
      };
    } else {
      updateData = {
        status: 'REVISION',
        isKoordinatorApproved: false,
        koordinatorNotes: notes ?? null,
        kaprodiNotes: null,
        prodiNotes: null,
      };
    }
  } else if (reviewer === 'prodi') {
    if (!existingDoc.isKoordinatorApproved) {
      return NextResponse.json({ error: 'Koordinator must approve first' }, { status: 400 });
    }
    if (action === 'approve') {
      updateData = {
        isProdiApproved: true,
        prodiId: userId ?? null,
        status: 'PENGECEKAN',
        prodiNotes: null,
      };
    } else {
      updateData = {
        status: 'REVISION',
        isKoordinatorApproved: false,
        isProdiApproved: false,
        prodiNotes: notes ?? null,
      };
    }
  } else if (reviewer === 'kaprodi') {
    if (!existingDoc.isProdiApproved) {
      return NextResponse.json({ error: 'Prodi must approve first' }, { status: 400 });
    }
    if (action === 'approve') {
      updateData = { status: 'APPROVED' };
    } else {
      updateData = {
        status: 'REVISION',
        isKoordinatorApproved: false,
        isProdiApproved: false,
        kaprodiNotes: notes ?? null,
      };
    }
  } else {
    return NextResponse.json({ error: 'Invalid reviewer' }, { status: 400 });
  }

  const doc = await prisma.academicDocument.update({
    where: { id: docId },
    data: updateData,
    select: {
      id: true,
      status: true,
      isKoordinatorApproved: true,
      isProdiApproved: true,
      koordinatorNotes: true,
      kaprodiNotes: true,
      prodiNotes: true,
      updatedAt: true,
    },
  });

  // Notifications
  const matkulLink = `/dashboard/matkul/${existingDoc.matkulId}`;
  const label = DOC_LABEL[existingDoc.type] ?? existingDoc.type;

  if (reviewer === 'koordinator') {
    if (action === 'approve') {
      await notifyRole(Role.PRODI, `Dokumen ${label} telah disetujui Koordinator dan menunggu review PRODI.`, matkulLink);
    } else {
      await createNotification(existingDoc.dosenId, `Dokumen ${label} Anda dikembalikan untuk revisi oleh Koordinator.`, matkulLink);
    }
  } else if (reviewer === 'prodi') {
    if (action === 'approve') {
      await notifyRole(Role.KAPRODI, `Dokumen ${label} telah disetujui PRODI dan menunggu persetujuan Kaprodi.`, matkulLink);
    } else {
      await createNotification(existingDoc.dosenId, `Dokumen ${label} Anda dikembalikan untuk revisi oleh PRODI.`, matkulLink);
    }
  } else if (reviewer === 'kaprodi') {
    if (action === 'approve') {
      await createNotification(existingDoc.dosenId, `Dokumen ${label} Anda telah disetujui dan selesai!`, matkulLink);
    } else {
      await createNotification(existingDoc.dosenId, `Dokumen ${label} Anda dikembalikan untuk revisi oleh Kaprodi.`, matkulLink);
    }
  }

  return NextResponse.json(doc);
}
