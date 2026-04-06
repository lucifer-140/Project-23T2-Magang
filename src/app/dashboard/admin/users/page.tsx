import { prisma } from '@/lib/db';
import { UsersClientPage } from './UsersClientPage';

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    include: {
      dosenMatkuls: { select: { id: true, code: true, name: true } },
    },
    orderBy: { role: 'asc' },
  });

  const allMatkuls = await prisma.matkul.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });

  return <UsersClientPage users={users as any} allMatkuls={allMatkuls} />;
}
