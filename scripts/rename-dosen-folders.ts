/**
 * Renames dosen folders inside files/ from full academic titles to canonical names.
 * Safe to re-run — skips already-renamed folders.
 *
 * Run: npx tsx scripts/rename-dosen-folders.ts
 */

import fs from 'fs';
import path from 'path';

const RENAME_MAP: Record<string, string> = {
  'Ade Maulana, S.Kom., M.T.I': 'Ade Maulana',
  'Adi, S.Kom': 'Adi',
  'Aditya Rama Mitra & Robertus Hudi, S. Inf., M.Kom': 'Aditya Rama Mitra',
  'Benz Edy Kusuma, M.Si': 'Benz Edy Kusuma',
  'Danny Philipe Bukidz, S.ST, M.Min, M.Si': 'Danny Philipe Bukidz',
  'Diana Astria Gultom, S.Pd.,M.Pd': 'Diana Astria Gultom',
  'Ferawaty, S.Kom., M.Kom': 'Ferawaty',
  'Hery, M.M.S.I': 'Hery',
  'I Made Murwantara, Ph.D': 'I Made Murwantara',
  'Ir. Jusin, M.T.I': 'Jusin',
  'Jepronel Saragih, S. Kom., M.Kom': 'Jepronel Saragih',
  'Mangasa A. S. Manullang, S. Kom., M. Kom': 'Mangasa Manullang',
  'Robertus Hudi, S. Inf., M.Kom': 'Robertus Hudi',
  'Robin, S.Kom., M.TI., MTA, MCE': 'Robin',
  'Romindo, S.Kom., M.Kom': 'Romindo',
  'Ronald Belferik, S.Kom., M.Kom': 'Ronald Belferik',
  'Wenripin Chandra, S.Kom., M.TI': 'Wenripin Chandra',
  'Yudhistira A. Pratama, S.Kom., M.Kom': 'Yudhistira Pratama',
};

const FILES_ROOT = path.resolve('files');

let renamed = 0;
let skipped = 0;
let conflicts = 0;

for (const yearEntry of fs.readdirSync(FILES_ROOT, { withFileTypes: true })) {
  if (!yearEntry.isDirectory()) continue;
  const yearDir = path.join(FILES_ROOT, yearEntry.name);

  for (const semEntry of fs.readdirSync(yearDir, { withFileTypes: true })) {
    if (!semEntry.isDirectory()) continue;
    const semDir = path.join(yearDir, semEntry.name);

    for (const dosenEntry of fs.readdirSync(semDir, { withFileTypes: true })) {
      if (!dosenEntry.isDirectory()) continue;
      const originalName = dosenEntry.name;
      const canonical = RENAME_MAP[originalName];

      if (!canonical) {
        // No rename needed — already canonical or unknown
        skipped++;
        continue;
      }

      const oldPath = path.join(semDir, originalName);
      const newPath = path.join(semDir, canonical);

      if (fs.existsSync(newPath)) {
        console.warn(`⚠  CONFLICT: "${canonical}" already exists in ${semDir} — skipping rename of "${originalName}"`);
        conflicts++;
        continue;
      }

      try {
        fs.renameSync(oldPath, newPath);
        console.log(`✓  ${yearEntry.name}/${semEntry.name}: "${originalName}" → "${canonical}"`);
        renamed++;
      } catch (e: any) {
        console.error(`✗  FAILED ${yearEntry.name}/${semEntry.name}: "${originalName}" → "${canonical}": ${e.message}`);
        conflicts++;
      }
    }
  }
}

console.log(`\nDone. Renamed: ${renamed} | Already canonical: ${skipped} | Conflicts: ${conflicts}`);
if (conflicts > 0) {
  console.log('Resolve conflicts manually before running generate-csv-templates.ts');
}
