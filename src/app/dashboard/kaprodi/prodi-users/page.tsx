import { prisma } from '@/lib/db';
import { ProdiUsersClient } from './ProdiUsersClient';

export default async function ProdiUsersPage() {
  const users = await prisma.user.findMany({
    where: { roles: { has: 'DOSEN' }, status: 'ACTIVE' },
    select: { id: true, name: true, email: true, roles: true },
    orderBy: { name: 'asc' },
  });

  return <ProdiUsersClient users={users} />;
}
