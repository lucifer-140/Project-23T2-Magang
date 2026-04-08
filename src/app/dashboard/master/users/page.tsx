import { prisma } from '@/lib/db';
import { UsersManageClientPage } from './UsersManageClientPage';

export default async function MasterUsersPage() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, username: true, roles: true },
    orderBy: { name: 'asc' },
  });

  return <UsersManageClientPage users={users} />;
}
