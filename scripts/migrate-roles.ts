import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany();
  for (const u of users) {
    if (!u.roles || u.roles.length === 0) {
      let rolesToAssign = ['DOSEN'];
      if (u.username === 'master') rolesToAssign = ['MASTER'];
      if (u.username === 'admin') rolesToAssign = ['ADMIN'];
      if (u.username === 'kaprodi') rolesToAssign = ['KAPRODI', 'DOSEN'];
      if (u.username === 'koordinator') rolesToAssign = ['KOORDINATOR', 'DOSEN'];
      // In Prisma, enum arrays are mapped to standard TS arrays
      await p.user.update({
        where: { id: u.id },
        data: { roles: rolesToAssign as any }
      });
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
