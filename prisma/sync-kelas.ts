/**
 * Creates Kelas records from distinct MatkulClass names and links them back.
 * Run: npx tsx prisma/sync-kelas.ts
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  // Get all MatkulClass records with no kelasId
  const classes = await prisma.matkulClass.findMany({
    select: { id: true, name: true },
  });

  const uniqueNames = [...new Set(classes.map(c => c.name.trim().toUpperCase()))];
  console.log(`Found ${uniqueNames.length} unique class names:`, uniqueNames);

  for (const name of uniqueNames) {
    // Upsert Kelas (skip if already exists)
    const kelas = await prisma.kelas.upsert({
      where: { name },
      create: { name },
      update: {},
    });

    // Link all MatkulClass with this name to the Kelas
    const result = await prisma.matkulClass.updateMany({
      where: { name, kelasId: null },
      data: { kelasId: kelas.id },
    });

    console.log(`Kelas "${name}" (${kelas.id}): linked ${result.count} MatkulClass record(s)`);
  }

  console.log('Done.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
