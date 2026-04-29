/**
 * Updates user emails in DB by matching on name, using users.csv as source.
 * Run: npx tsx scripts/update-user-emails.ts [--dry-run]
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);
const DRY_RUN = process.argv.includes('--dry-run');

function parseCsv(filePath: string): Record<string, string>[] {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? '').trim()]));
  });
}

async function main() {
  if (DRY_RUN) console.log('=== DRY RUN — no DB writes ===\n');

  const csvPath = path.resolve('import-data', 'metadata', 'users.csv');
  const rows = parseCsv(csvPath);

  let updated = 0;
  let notFound = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.name || !row.email) {
      console.warn(`⚠  Skipping row — missing name or email: ${JSON.stringify(row)}`);
      skipped++;
      continue;
    }

    const existing = await prisma.user.findFirst({ where: { name: row.name } });

    if (!existing) {
      console.warn(`✗  Not found in DB: "${row.name}"`);
      notFound++;
      continue;
    }

    if (existing.email === row.email) {
      console.log(`–  No change: "${row.name}" (${row.email})`);
      skipped++;
      continue;
    }

    console.log(`✓  Update: "${row.name}"  ${existing.email}  →  ${row.email}`);
    if (!DRY_RUN) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { email: row.email },
      });
    }
    updated++;
  }

  console.log(`\nUpdated: ${updated} | Not found: ${notFound} | Skipped/unchanged: ${skipped}`);
  if (DRY_RUN) console.log('⚠  Dry run — nothing written.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect().finally(() => pool.end()));
