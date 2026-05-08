import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, getRoles, unauthorized, forbidden } from '@/lib/auth';
import { runDocumentMatrixPivot } from '@/lib/queries/documentMatrixPivot';

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();

  const roles = await getRoles();
  if (!roles.includes('MASTER') && !roles.includes('KAPRODI')) return forbidden();

  const semesterId = req.nextUrl.searchParams.get('semesterId');
  if (!semesterId) return NextResponse.json({ error: 'semesterId required' }, { status: 400 });

  const rows = await runDocumentMatrixPivot(semesterId);
  return NextResponse.json(rows);
}
