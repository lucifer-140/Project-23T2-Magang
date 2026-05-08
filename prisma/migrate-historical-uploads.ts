import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { rename, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) } as never);
const DRY_RUN = process.argv.includes('--dry-run');

const DOC_TYPE_FOLDER: Record<string, string> = {
  RPS: 'rps',
  SOAL_UTS: 'soal-uts',
  SOAL_UAS: 'soal-uas',
  LPP: 'lpp',
  EPP: 'epp',
  EPP_UTS: 'epp-uts',
  EPP_UAS: 'epp-uas',
  BERITA_ACARA: 'berita-acara',
};

function docTypeToFolder(type: string): string {
  return DOC_TYPE_FOLDER[type] ?? type.toLowerCase().replace(/_/g, '-');
}

async function main() {
  if (DRY_RUN) console.log('[DRY RUN] No files or DB rows will be modified.\n');

  // Historical URLs: /uploads/historical/{tahun}/{semester}/{dosenFolder}/{filename}
  const rows = await (prisma as any).academicDocument.findMany({
    where: { fileUrl: { contains: '/uploads/historical/' } },
    select: { id: true, fileUrl: true, type: true },
  });

  console.log(`Found ${rows.length} historical AcademicDocument rows to migrate.`);

  let moved = 0, skipped = 0, errors = 0;

  for (const row of rows) {
    // Parse: /uploads/historical/{tahun}/{sem}/{dosenFolder}/{filename}
    const parts = row.fileUrl.replace(/^\//, '').split('/');
    // parts: ['uploads','historical',tahun,sem,dosenFolder,filename]
    if (parts.length < 6) {
      console.warn(`[SKIP] Unexpected URL format: ${row.fileUrl}`);
      skipped++; continue;
    }
    const tahun = parts[2];
    const sem = parts[3];
    const filename = parts.slice(5).join('/'); // preserve subfolder if any
    const typeFolder = docTypeToFolder(row.type);
    const newRelUrl = `/uploads/${typeFolder}/${tahun}/${sem}/final/${filename}`;

    if (row.fileUrl === newRelUrl) {
      console.log(`[SKIP] Already at destination: ${row.fileUrl}`);
      skipped++; continue;
    }

    console.log(`[MOVE] ${row.fileUrl}\n    -> ${newRelUrl}`);

    if (!DRY_RUN) {
      const oldAbsPath = path.join(process.cwd(), 'public', row.fileUrl);
      const newAbsPath = path.join(process.cwd(), 'public', newRelUrl);

      if (!existsSync(oldAbsPath)) {
        console.warn(`  [WARN] Source file missing: ${oldAbsPath}`);
        errors++; continue;
      }
      try {
        await mkdir(path.dirname(newAbsPath), { recursive: true });
        await rename(oldAbsPath, newAbsPath);
        await (prisma as any).academicDocument.update({
          where: { id: row.id },
          data: { fileUrl: newRelUrl },
        });
        moved++;
      } catch (err) {
        console.error(`  [ERROR] ${(err as Error).message}`);
        errors++;
      }
    } else {
      moved++;
    }
  }

  console.log(`\nDone. Moved: ${moved}, Skipped: ${skipped}, Errors: ${errors}`);
  if (DRY_RUN) console.log('Re-run without --dry-run to execute.');
}

main().catch(console.error).finally(() => { prisma.$disconnect(); pool.end(); });
