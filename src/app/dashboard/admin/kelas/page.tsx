import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import KelasClientPage from './KelasClientPage';

export default async function KelasPage() {
  const cookieStore = await cookies();
  const roleStr = cookieStore.get('userRole')?.value ?? '';
  let roles: string[] = [];
  try {
    const parsed = JSON.parse(decodeURIComponent(roleStr));
    roles = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    roles = [roleStr];
  }
  if (!roles.includes('ADMIN') && !roles.includes('MASTER')) redirect('/dashboard/admin');

  const kelas = await prisma.kelas.findMany({
    include: {
      dosenPa: { select: { id: true, name: true } },
      _count: { select: { baps: true, matkulClasses: true } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <KelasClientPage
      kelas={kelas.map(k => ({
        id: k.id,
        name: k.name,
        isLocked: k.isLocked,
        dosenPa: k.dosenPa,
        bapCount: k._count.baps,
        matkulClassCount: k._count.matkulClasses,
        createdAt: k.createdAt.toISOString(),
      }))}
    />
  );
}
