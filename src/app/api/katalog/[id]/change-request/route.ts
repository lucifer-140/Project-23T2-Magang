import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { notifyRole } from '@/lib/notifications';

// POST /api/katalog/[id]/change-request
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { proposedName, proposedCode, proposedSks, reason } = await req.json();
  const cookieStore = await cookies();
  const requestedById = cookieStore.get('userId')?.value ?? null;

  const katalog = await prisma.katalogMatkul.findUnique({ where: { id }, select: { code: true, name: true } });
  if (!katalog) return NextResponse.json({ error: 'Katalog matkul not found' }, { status: 404 });

  let request;
  try {
    request = await prisma.matkulChangeRequest.create({
      data: {
        katalogMatkulId: id,
        requestedById,
        proposedName: proposedName || null,
        proposedCode: proposedCode || null,
        proposedSks: proposedSks ? parseInt(proposedSks) : null,
        reason,
        status: 'PENDING',
      },
    });
    await notifyRole('KAPRODI', `Ada permintaan perubahan matkul ${katalog.code} - ${katalog.name} yang menunggu persetujuan Anda.`, `/dashboard/kaprodi/requests`);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  return NextResponse.json(request, { status: 201 });
}
