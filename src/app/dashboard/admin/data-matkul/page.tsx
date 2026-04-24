import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DataMatkulClient from './DataMatkulClient';

export default async function DataMatkulPage() {
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

  const katalog = await prisma.katalogMatkul.findMany({
    include: { _count: { select: { matkuls: true } } },
    orderBy: { name: 'asc' },
  });

  const data = katalog.map(k => ({
    id: k.id,
    code: k.code,
    name: k.name,
    sks: k.sks,
    semesterCount: k._count.matkuls,
  }));

  return <DataMatkulClient matkuls={data} />;
}
