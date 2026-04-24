import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { notifyRole } from '@/lib/notifications';

// POST /api/matkul/[id]/change-request
// Looks up the matkul's catalog entry and creates a change request against it.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { proposedName, proposedCode, proposedSks, reason } = await req.json();
  const cookieStore = await cookies();
  const requestedById = cookieStore.get('userId')?.value ?? null;

  const matkul = await prisma.matkul.findUnique({
    where: { id },
    select: { katalogMatkulId: true, katalogMatkul: { select: { code: true, name: true } } },
  });
  if (!matkul?.katalogMatkulId || !matkul.katalogMatkul) {
    return NextResponse.json({ error: 'Matkul tidak terhubung ke katalog' }, { status: 400 });
  }

  let request;
  try {
    request = await prisma.matkulChangeRequest.create({
      data: {
        katalogMatkulId: matkul.katalogMatkulId,
        requestedById,
        proposedName: proposedName || null,
        proposedCode: proposedCode || null,
        proposedSks: proposedSks ? parseInt(proposedSks) : null,
        reason,
        status: 'PENDING',
      },
    });
    await notifyRole('KAPRODI', `Ada permintaan perubahan matkul ${matkul.katalogMatkul.code} - ${matkul.katalogMatkul.name} yang menunggu persetujuan Anda.`, `/dashboard/kaprodi/requests`);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  return NextResponse.json(request, { status: 201 });
}

// GET /api/matkul/[id]/change-request - Get change requests for a matkul's catalog entry
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const matkul = await prisma.matkul.findUnique({ where: { id }, select: { katalogMatkulId: true } });
  if (!matkul?.katalogMatkulId) return NextResponse.json([]);
  const requests = await prisma.matkulChangeRequest.findMany({
    where: { katalogMatkulId: matkul.katalogMatkulId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(requests);
}
