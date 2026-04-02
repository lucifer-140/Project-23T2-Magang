import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'password',
      role: 'ADMIN',
      name: 'Bapak Kaprodi',
    },
  });
  
  const dosen = await prisma.user.upsert({
    where: { username: 'dosen' },
    update: {},
    create: {
      username: 'dosen',
      password: 'password',
      role: 'DOSEN',
      name: 'Ibu Dosen',
    },
  });

  return NextResponse.json({ message: 'Seed berhasil', admin, dosen });
}
