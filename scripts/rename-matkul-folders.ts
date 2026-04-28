/**
 * Renames {ClassName}_{MatkulName} folders to canonical matkul names.
 * Fixes typos and case inconsistencies across all years/semesters/dosens.
 *
 * Run: npx tsx scripts/rename-matkul-folders.ts
 */

import fs from 'fs';
import path from 'path';

// key = typo matkul name, value = canonical matkul name
const MATKUL_RENAME: Record<string, string> = {
  'Algortima & Pemograman':                    'Algoritma & Pemograman',
  'Aljabar Linear & Matriks':                  'Aljabar Linier & Matriks',
  'Interaksi Manusia Dan Komputer':            'Interaksi Manusia & Komputer',
  'Kalkulus':                                  'Kalkulus 1',
  'Kalkulus I':                                'Kalkulus 1',
  'Komunikasi Data & Jaringan Kompiter':       'Komunikasi Data & Jaringan Komputer',
  'Metodologi penelitian':                     'Metodologi Penelitian',
  'Organisasi & Arsitektur Komputer':          'Organisasi dan Arsitektur Komputer',
  'Organisasi Dan Arsitektur Komputer':        'Organisasi dan Arsitektur Komputer',
  'Pemograman Berorientasi Objek':             'Pemrograman Berorientasi Objek',
  'Permodelan Berorientasi Objek':             'Pemodelan Berorientasi Objek',
  'Pengembangan Aplikasi Berbasis Web Ii':     'Pengembangan Aplikasi Berbasis Web II',
  'Pengmbangan Aplikasi Berbasis Web II':      'Pengembangan Aplikasi Berbasis Web II',
  'Rekayasa Aplikasi terdistribusi':           'Rekayasa Aplikasi Terdistribusi',
  'Teknik Pemograman':                         'Teknik Pemrograman',
};

const FILES_ROOT = path.resolve('files');

let renamed = 0;
let skipped = 0;
let failed = 0;

for (const yearEntry of fs.readdirSync(FILES_ROOT, { withFileTypes: true })) {
  if (!yearEntry.isDirectory()) continue;
  const yearDir = path.join(FILES_ROOT, yearEntry.name);

  for (const semEntry of fs.readdirSync(yearDir, { withFileTypes: true })) {
    if (!semEntry.isDirectory()) continue;
    const semDir = path.join(yearDir, semEntry.name);

    for (const dosenEntry of fs.readdirSync(semDir, { withFileTypes: true })) {
      if (!dosenEntry.isDirectory()) continue;
      const dosenDir = path.join(semDir, dosenEntry.name);

      for (const classEntry of fs.readdirSync(dosenDir, { withFileTypes: true })) {
        if (!classEntry.isDirectory()) continue;
        const folderName = classEntry.name;
        const underscoreIdx = folderName.indexOf('_');
        if (underscoreIdx === -1) { skipped++; continue; }

        const className = folderName.slice(0, underscoreIdx);
        const matkulName = folderName.slice(underscoreIdx + 1);
        const canonical = MATKUL_RENAME[matkulName];
        if (!canonical) { skipped++; continue; }

        const oldPath = path.join(dosenDir, folderName);
        const newFolderName = `${className}_${canonical}`;
        const newPath = path.join(dosenDir, newFolderName);

        if (fs.existsSync(newPath)) {
          console.warn(`⚠  CONFLICT: "${newFolderName}" exists — skipping "${folderName}"`);
          failed++;
          continue;
        }

        try {
          fs.renameSync(oldPath, newPath);
          console.log(`✓  ${yearEntry.name}/${semEntry.name}/${dosenEntry.name}: "${folderName}" → "${newFolderName}"`);
          renamed++;
        } catch (e: any) {
          console.error(`✗  FAILED "${folderName}": ${e.message}`);
          failed++;
        }
      }
    }
  }
}

console.log(`\nDone. Renamed: ${renamed} | No change needed: ${skipped} | Failed: ${failed}`);
