import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// GET /api/documents/[docId]/annotations
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const annotations = await prisma.academicDocAnnotation.findMany({
    where: { docId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(annotations);
}

// POST /api/documents/[docId]/annotations
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;

  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  let roles: string[] = [];
  try { if (roleRaw) roles = JSON.parse(decodeURIComponent(roleRaw)); } catch { roles = []; }

  const isReviewer = roles.includes('KOORDINATOR') || roles.includes('KAPRODI');
  if (!isReviewer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { type, page, x, y, width, height, color, content, pathData, reviewerRole } = await req.json();
  if (!type || !page || x == null || y == null || !reviewerRole) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const annotation = await prisma.academicDocAnnotation.create({
    data: {
      docId,
      type,
      page,
      x,
      y,
      width: width ?? null,
      height: height ?? null,
      color: color ?? '#FFD700',
      content: content ?? null,
      pathData: pathData ?? null,
      reviewerRole,
    },
  });

  return NextResponse.json(annotation, { status: 201 });
}
