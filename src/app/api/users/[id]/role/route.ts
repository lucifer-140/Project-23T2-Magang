import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

// PATCH /api/users/[id]/role - Update user role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { roles: passedRoles, role } = await req.json();

  let rolesArray: string[] = [];
  if (passedRoles && Array.isArray(passedRoles)) {
    rolesArray = passedRoles;
  } else if (role) {
    rolesArray = [role]; 
  } else {
    return NextResponse.json({ error: 'Roles array required.' }, { status: 400 });
  }

  const validRoles = ['MASTER', 'ADMIN', 'KAPRODI', 'KOORDINATOR', 'DOSEN'];
  const hasInvalidRoles = rolesArray.some(r => !validRoles.includes(r));
  if (hasInvalidRoles) {
    return NextResponse.json({ error: 'Invalid roles provided.' }, { status: 400 });
  }

  // RBAC checks
  const cookieStore = await cookies();
  const callerRoleStr = cookieStore.get('userRole')?.value || '';
  const isMasterCaller = callerRoleStr.includes('MASTER');

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Prevent editing a MASTER or ADMIN user if caller is not MASTER
  if (!isMasterCaller && (targetUser.roles.includes('MASTER') || targetUser.roles.includes('ADMIN'))) {
    return NextResponse.json({ error: 'Unauthorized to edit MASTER or ADMIN accounts' }, { status: 403 });
  }

  // Prevent assigning MASTER or ADMIN role if caller is not MASTER
  if (!isMasterCaller && (rolesArray.includes('MASTER') || rolesArray.includes('ADMIN'))) {
    return NextResponse.json({ error: 'Unauthorized to assign MASTER or ADMIN role' }, { status: 403 });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { roles: rolesArray as any },
  });
  return NextResponse.json({ ...updatedUser, role: rolesArray[0] }); // send back legacy field temporarily for compatibility if needed
}
