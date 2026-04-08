import { prisma } from '@/lib/db';
import { MatkulClientPage } from './MatkulClientPage';

export default async function MatkulPage() {
  const [matkuls, dosens, koordinators] = await Promise.all([
    prisma.matkul.findMany({
      include: { 
        dosens: { select: { id: true, name: true, username: true } },
        koordinators: { select: { id: true, name: true, username: true } }
      },
      orderBy: { code: 'asc' },
    }),
    prisma.user.findMany({
      where: { roles: { has: 'DOSEN' } },
      select: { id: true, name: true, username: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { roles: { has: 'KOORDINATOR' } },
      select: { id: true, name: true, username: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return <MatkulClientPage matkuls={matkuls} dosens={dosens} koordinators={koordinators} />;
}
