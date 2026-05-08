import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, password: true } });
  let updated = 0;

  for (const user of users) {
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      console.log(`SKIP ${user.email} — already hashed`);
      continue;
    }
    const hashed = await bcrypt.hash(user.password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    console.log(`HASHED ${user.email}`);
    updated++;
  }

  console.log(`\nDone. ${updated} passwords hashed.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
