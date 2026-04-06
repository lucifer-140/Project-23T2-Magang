import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/users - List all users
export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, role: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(users);
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  const { name, username, password, role } = await req.json();

  if (!name || !username || !password || !role) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  const validRoles = ['MASTER', 'ADMIN', 'KAPRODI', 'KOORDINATOR', 'DOSEN'];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: 'Username sudah digunakan.' }, { status: 409 });
  }

  // NOTE: In production, hash the password before storing it.
  const user = await prisma.user.create({
    data: { name, username, password, role },
    select: { id: true, name: true, username: true, role: true },
  });

  return NextResponse.json(user, { status: 201 });
}
