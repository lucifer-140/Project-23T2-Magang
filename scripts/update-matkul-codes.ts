import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const CODE_MAP: Record<string, string> = {
  'TI-AP-OLD':      'IFT09102',
  'TI-APL-OLD':     'IFT0971A',
  'TI-FT-OLD':      'IFT0982A',
  'TI-KK-OLD':      'IFT09703',
  'TI-LE-OLD':      'CFE20202',
  'TI-PTIK-OLD':    'IFT09104',
  'TI-DESK-OLD':    'IFT09403',
  'TI-WEBDEV1-OLD': 'IFT09507',
  'TI-WEBDEV2-OLD': 'IFT09602',
  'TI-PKI-OLD':     'IFT09401',
  'TI-RAT-OLD':     'IFT0981A',
  'TI-RO-OLD':      'IFT09505',
  'TI-SIM-OLD':     'IFT09203',
  'TI-SP-OLD':      'IFT09202',
  'TI-SD-OLD':      'IFT09201',
  'TI-TECH-OLD':    'IFT09801',
  'TI-TP-OLD':      'IFT0961A',
};

async function main() {
  let katalogUpdated = 0;
  let matkulUpdated = 0;

  for (const [oldCode, newCode] of Object.entries(CODE_MAP)) {
    // Update KatalogMatkul
    const katalog = await prisma.katalogMatkul.findUnique({ where: { code: oldCode } });
    if (katalog) {
      await prisma.katalogMatkul.update({ where: { id: katalog.id }, data: { code: newCode } });
      katalogUpdated++;
      console.log(`KatalogMatkul: ${oldCode} → ${newCode}`);
    }

    // Update all Matkul instances with that code
    const result = await prisma.matkul.updateMany({ where: { code: oldCode }, data: { code: newCode } });
    matkulUpdated += result.count;
    if (result.count > 0) console.log(`  Matkul instances updated: ${result.count}`);
  }

  console.log(`\nDone. KatalogMatkul: ${katalogUpdated}, Matkul instances: ${matkulUpdated}`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
