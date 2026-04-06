import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/users/[id]/role - Update user role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { role } = await req.json();

  const validRoles = ['MASTER', 'ADMIN', 'KAPRODI', 'KOORDINATOR', 'DOSEN'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });
  return NextResponse.json(user);
}
