/**
 * Walks files/ after rename-dosen-folders.ts has run.
 * Outputs import-data/metadata/users.csv and import-data/metadata/matkul.csv
 * with all unique dosen names and matkul names pre-filled.
 * You fill in: email, roles (users.csv) and code, sks (matkul.csv).
 *
 * Run: npx tsx scripts/generate-csv-templates.ts
 */

import fs from 'fs';
import path from 'path';

const FILES_ROOT = path.resolve('files');
const OUT_DIR = path.resolve('import-data', 'metadata');

fs.mkdirSync(OUT_DIR, { recursive: true });

const dosenNames = new Set<string>();
const matkulNames = new Set<string>();

for (const yearEntry of fs.readdirSync(FILES_ROOT, { withFileTypes: true })) {
  if (!yearEntry.isDirectory()) continue;
  const yearDir = path.join(FILES_ROOT, yearEntry.name);

  for (const semEntry of fs.readdirSync(yearDir, { withFileTypes: true })) {
    if (!semEntry.isDirectory()) continue;
    const semDir = path.join(yearDir, semEntry.name);

    for (const dosenEntry of fs.readdirSync(semDir, { withFileTypes: true })) {
      if (!dosenEntry.isDirectory()) continue;
      dosenNames.add(dosenEntry.name);
      const dosenDir = path.join(semDir, dosenEntry.name);

      for (const classEntry of fs.readdirSync(dosenDir, { withFileTypes: true })) {
        if (!classEntry.isDirectory()) continue;
        // folder name pattern: {ClassName}_{MatkulName}
        const underscoreIdx = classEntry.name.indexOf('_');
        if (underscoreIdx === -1) {
          console.warn(`⚠  Unexpected folder name (no underscore): ${classEntry.name}`);
          continue;
        }
        const matkulName = classEntry.name.slice(underscoreIdx + 1);
        matkulNames.add(matkulName);
      }
    }
  }
}

// Write users.csv
const usersPath = path.join(OUT_DIR, 'users.csv');
const usersExists = fs.existsSync(usersPath);
if (usersExists) {
  // Merge: add new names that aren't already in the file
  const existing = fs.readFileSync(usersPath, 'utf-8');
  const existingNames = new Set(
    existing.split('\n').slice(1).filter(Boolean).map(l => l.split(',')[0])
  );
  const newRows = [...dosenNames]
    .filter(n => !existingNames.has(n))
    .sort()
    .map(n => `${n},,dosen123,DOSEN`);
  if (newRows.length > 0) {
    fs.appendFileSync(usersPath, '\n' + newRows.join('\n'));
    console.log(`users.csv: added ${newRows.length} new name(s)`);
  } else {
    console.log('users.csv: no new names to add');
  }
} else {
  const rows = ['name,email,password,roles', ...[...dosenNames].sort().map(n => `${n},,dosen123,DOSEN`)];
  fs.writeFileSync(usersPath, rows.join('\n'));
  console.log(`users.csv: created with ${dosenNames.size} dosen(s)`);
}

// Write matkul.csv
const matkulPath = path.join(OUT_DIR, 'matkul.csv');
const matkulExists = fs.existsSync(matkulPath);
if (matkulExists) {
  const existing = fs.readFileSync(matkulPath, 'utf-8');
  const existingNames = new Set(
    existing.split('\n').slice(1).filter(Boolean).map(l => l.split(',')[0])
  );
  const newRows = [...matkulNames]
    .filter(n => !existingNames.has(n))
    .sort()
    .map(n => `${n},,`);
  if (newRows.length > 0) {
    fs.appendFileSync(matkulPath, '\n' + newRows.join('\n'));
    console.log(`matkul.csv: added ${newRows.length} new course(s)`);
  } else {
    console.log('matkul.csv: no new courses to add');
  }
} else {
  const rows = ['name,code,sks', ...[...matkulNames].sort().map(n => `${n},,`)];
  fs.writeFileSync(matkulPath, rows.join('\n'));
  console.log(`matkul.csv: created with ${matkulNames.size} course(s)`);
}

console.log(`\nFiles written to ${OUT_DIR}`);
console.log('Next: fill email+roles in users.csv, fill code+sks in matkul.csv');
