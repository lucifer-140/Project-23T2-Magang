import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// GET /api/rps/[id]/annotations
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const annotations = await prisma.rpsAnnotation.findMany({
    where: { rpsId: id },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(annotations);
}

// POST /api/rps/[id]/annotations
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  const body = await req.json();
  const { type, page, x, y, width, height, color, content, pathData, reviewerRole } = body;

  if (!type || !page || x == null || y == null || !reviewerRole) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const annotation = await prisma.rpsAnnotation.create({
    data: {
      rpsId: id,
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
