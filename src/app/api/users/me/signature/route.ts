import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// GET /api/users/me/signature - return the calling user's saved signature
export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value ?? '';
  if (!userId) return NextResponse.json({ savedSignature: null });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { savedSignature: true },
  });

  return NextResponse.json({ savedSignature: user?.savedSignature ?? null });
}

// PATCH /api/users/me/signature - save or clear the calling user's signature
export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value ?? '';
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { savedSignature } = await req.json() as { savedSignature: string | null };

  const user = await prisma.user.update({
    where: { id: userId },
    data: { savedSignature: savedSignature ?? null },
    select: { savedSignature: true },
  });

  return NextResponse.json({ savedSignature: user.savedSignature });
}
