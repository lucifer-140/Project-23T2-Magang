import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApprovalsClient } from '@/app/dashboard/admin/approvals/ApprovalsClient';

export default async function MasterApprovalsPage() {
  const cookieStore = await cookies();
  const roleStr = cookieStore.get('userRole')?.value || '';
  const isMaster = roleStr.includes('MASTER');

  if (!isMaster) redirect('/dashboard/master');

  const pendingUsers = await prisma.user.findMany({
    where: { status: 'PENDING' },
    select: { id: true, name: true, email: true, roles: true, status: true },
    orderBy: { name: 'asc' },
  });

  return <ApprovalsClient initialUsers={pendingUsers} callerIsMaster={true} />;
}
