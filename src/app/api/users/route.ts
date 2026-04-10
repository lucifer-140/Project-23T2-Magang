import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

// GET /api/users - List all users
// Query params:
//   ?status=pending  → return only PENDING users (for approval dashboard)
//   (default)        → return only ACTIVE users
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const callerRoleStr = cookieStore.get('userRole')?.value || '';
  const isMasterCaller = callerRoleStr.includes('MASTER');
  const isAdminCaller = callerRoleStr.includes('ADMIN');

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status');

  // Only ADMIN or MASTER can view PENDING users
  if (statusFilter === 'pending' && !isMasterCaller && !isAdminCaller) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const whereStatus = statusFilter === 'pending' ? 'PENDING' : 'ACTIVE';

  let users = await prisma.user.findMany({
    where: { status: whereStatus as any },
    select: { id: true, name: true, email: true, roles: true, status: true },
    orderBy: { name: 'asc' },
  });

  // HIDE MASTER from non-master callers
  if (!isMasterCaller) {
    users = users.filter(u => !u.roles.includes('MASTER'));
  }

  return NextResponse.json(users);
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  const { name, email, password, role, roles: passedRoles } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  let rolesArray = ['DOSEN'];
  if (passedRoles && Array.isArray(passedRoles)) {
    rolesArray = passedRoles;
  } else if (role) {
    rolesArray = [role];
  }

  const validRoles = ['MASTER', 'ADMIN', 'KAPRODI', 'KOORDINATOR', 'DOSEN'];
  const hasInvalidRoles = rolesArray.some(r => !validRoles.includes(r));
  if (hasInvalidRoles) {
    return NextResponse.json({ error: 'Invalid roles array.' }, { status: 400 });
  }

  // Security check: Only MASTER caller can create MASTER or ADMIN
  const cookieStore = await cookies();
  const callerRoleStr = cookieStore.get('userRole')?.value || '';
  const isMasterCaller = callerRoleStr.includes('MASTER');

  if ((rolesArray.includes('MASTER') || rolesArray.includes('ADMIN')) && !isMasterCaller) {
    return NextResponse.json({ error: 'Unauthorized to create MASTER or ADMIN accounts.' }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email sudah digunakan.' }, { status: 409 });
  }

  // NOTE: In production, hash the password before storing it.
  const user = await prisma.user.create({
    data: { name, email, password, roles: rolesArray as any },
    select: { id: true, name: true, email: true, roles: true },
  });

  return NextResponse.json(user, { status: 201 });
}
