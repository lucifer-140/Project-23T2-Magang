import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// PATCH /api/users/[id] - Update user info (name, username, password)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, username, password } = await req.json();

  if (!name && !username && !password) {
    return NextResponse.json({ error: 'At least one field is required.' }, { status: 400 });
  }

  const data: { name?: string; username?: string; password?: string } = {};
  if (name) data.name = name;
  if (username) data.username = username;
  if (password) data.password = password; // NOTE: Hash in production

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, username: true, role: true },
  });

  return NextResponse.json(user);
}

// DELETE /api/users/[id] - Delete a user
// Note: Uses cascade on relations via Prisma. dosenMatkuls and koordinatorMatkuls
// are many-to-many implicit joins - Prisma removes these automatically.
// RPS records referencing this user as dosenId will still reference the ID
// (orphaned data). If cascading deletes are needed on RPS, add onDelete: Cascade
// to schema and re-migrate.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Safety: Prevent deleting MASTER accounts via this API
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  if (target.role === 'MASTER') {
    return NextResponse.json({ error: 'Cannot delete a MASTER account.' }, { status: 403 });
  }

  // Disconnect many-to-many relations before deleting
  await prisma.user.update({
    where: { id },
    data: {
      dosenMatkuls: { set: [] },
      koordinatorMatkuls: { set: [] },
    },
  });

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
