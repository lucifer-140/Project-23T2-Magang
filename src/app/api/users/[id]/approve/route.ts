import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { sendAccountApprovedEmail, sendAccountRejectedEmail } from '@/lib/email';

// PATCH /api/users/[id]/approve
// Body: { action: 'approve' | 'reject', roles?: string[] }
// Only ADMIN or MASTER can call this.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Authorization: only ADMIN or MASTER
  const cookieStore = await cookies();
  const callerRoleStr = cookieStore.get('userRole')?.value || '';
  let callerRoles: string[] = [];
  try {
    const parsed = JSON.parse(decodeURIComponent(callerRoleStr));
    callerRoles = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    callerRoles = [callerRoleStr];
  }

  const isMaster = callerRoles.includes('MASTER');
  const isAdmin = callerRoles.includes('ADMIN');

  if (!isMaster && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const { action, roles } = await req.json();

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject".' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  if (target.status !== 'PENDING') {
    return NextResponse.json({ error: 'User is not in PENDING status.' }, { status: 409 });
  }

  if (action === 'reject') {
    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'REJECTED' },
      select: { id: true, name: true, email: true, roles: true, status: true },
    });
    sendAccountRejectedEmail(updated).catch(() => {});
    return NextResponse.json(updated);
  }

  // action === 'approve'
  let finalRoles: string[] = ['DOSEN'];

  if (roles && Array.isArray(roles) && roles.length > 0) {
    const validRoles = ['MASTER', 'ADMIN', 'KAPRODI', 'KOORDINATOR', 'DOSEN'];
    const hasInvalid = roles.some((r: string) => !validRoles.includes(r));
    if (hasInvalid) {
      return NextResponse.json({ error: 'Invalid roles provided.' }, { status: 400 });
    }

    // Only MASTER can assign MASTER or ADMIN roles
    if (!isMaster && (roles.includes('MASTER') || roles.includes('ADMIN'))) {
      return NextResponse.json({ error: 'Only MASTER can assign MASTER or ADMIN roles.' }, { status: 403 });
    }

    finalRoles = roles;
    // Ensure DOSEN is always included for non-admin/master accounts
    if (!finalRoles.includes('ADMIN') && !finalRoles.includes('MASTER') && !finalRoles.includes('DOSEN')) {
      finalRoles = [...finalRoles, 'DOSEN'];
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'ACTIVE', roles: finalRoles as any },
    select: { id: true, name: true, email: true, roles: true, status: true },
  });

  sendAccountApprovedEmail(updated).catch(() => {});
  return NextResponse.json(updated);
}
