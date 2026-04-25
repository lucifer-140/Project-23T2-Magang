import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApprovalsClient } from './ApprovalsClient';
import AutoRefresh from '@/components/AutoRefresh';

export default async function AdminApprovalsPage() {
  const cookieStore = await cookies();
  const roleStr = cookieStore.get('userRole')?.value || '';
  const isAdmin = roleStr.includes('ADMIN');
  const isMaster = roleStr.includes('MASTER');

  if (!isAdmin && !isMaster) redirect('/dashboard/admin');

  const pendingUsers = await prisma.user.findMany({
    where: { status: 'PENDING' },
    select: { id: true, name: true, email: true, roles: true, status: true },
    orderBy: { name: 'asc' },
  });

  return <><ApprovalsClient initialUsers={pendingUsers} callerIsMaster={isMaster} /><AutoRefresh /></>;
}
