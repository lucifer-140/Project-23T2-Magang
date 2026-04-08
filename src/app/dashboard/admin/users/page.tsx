import { prisma } from '@/lib/db';
import { UsersClientPage } from './UsersClientPage';
import { cookies } from 'next/headers';

export default async function UsersPage() {
  const cookieStore = await cookies();
  const callerRoleStr = cookieStore.get('userRole')?.value || '';
  const isMasterCaller = callerRoleStr.includes('MASTER');

  const users = await prisma.user.findMany({
    include: {
      dosenMatkuls: { select: { id: true, code: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });

  // HIDE MASTER users from non-master admins
  const visibleUsers = isMasterCaller ? users : users.filter(u => !u.roles.includes('MASTER'));

  const allMatkuls = await prisma.matkul.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });

  return <UsersClientPage users={visibleUsers as any} allMatkuls={allMatkuls} />;
}
