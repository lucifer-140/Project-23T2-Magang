import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// DELETE /api/rps/[id]/annotations/[annotId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; annotId: string }> }
) {
  const { annotId } = await params;

  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try {
    if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw));
  } catch {
    roles = roleRaw ? [roleRaw] : [];
  }

  const isReviewer = roles.includes('KOORDINATOR') || roles.includes('KAPRODI');
  if (!isReviewer) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.rpsAnnotation.delete({ where: { id: annotId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
  }
}
