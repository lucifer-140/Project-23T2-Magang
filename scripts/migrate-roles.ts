import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany();
  for (const u of users) {
    if (!u.roles || u.roles.length === 0) {
      let rolesToAssign = ['DOSEN'];
      if (u.email === 'master@uph.edu') rolesToAssign = ['MASTER'];
      if (u.email === 'admin@uph.edu') rolesToAssign = ['ADMIN'];
      if (u.email === 'kaprodi@uph.edu') rolesToAssign = ['KAPRODI', 'DOSEN'];
      if (u.email === 'koordinator@uph.edu') rolesToAssign = ['KOORDINATOR', 'DOSEN'];
      // In Prisma, enum arrays are mapped to standard TS arrays
      await p.user.update({
        where: { id: u.id },
        data: { roles: rolesToAssign as any }
      });
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());
