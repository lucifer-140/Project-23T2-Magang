/**
 * Imports historical academic documents from files/ into the database.
 *
 * Prerequisites:
 *   1. Run scripts/rename-dosen-folders.ts
 *   2. Run scripts/generate-csv-templates.ts
 *   3. Fill import-data/metadata/users.csv (email, roles)
 *   4. Fill import-data/metadata/matkul.csv (code, sks)
 *
 * Run: npx tsx scripts/import-historical.ts [--dry-run]
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient, DocType, DocStatus, UserStatus, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);
const DRY_RUN = process.argv.includes('--dry-run');
const FILES_ROOT = path.resolve('files');
const METADATA_DIR = path.resolve('import-data', 'metadata');
const UPLOAD_DEST = path.resolve('public', 'uploads', 'historical');

const VALID_DOC_FILES: Record<string, DocType | 'RPS'> = {
  'lpp.pdf': DocType.LPP,
  'soal_uts.pdf': DocType.SOAL_UTS,
  'soal_uas.pdf': DocType.SOAL_UAS,
  'epp_uts.pdf': DocType.EPP_UTS,
  'epp_uas.pdf': DocType.EPP_UAS,
  'rps.pdf': 'RPS',
};

// ── CSV parsing ────────────────────────────────────────────────────────────────

function parseCsv(filePath: string): Record<string, string>[] {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n').filter(l => l.trim());
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? '').trim()]));
  });
}

// ── Validation ─────────────────────────────────────────────────────────────────

function validate() {
  const errors: string[] = [];

  if (!fs.existsSync(path.join(METADATA_DIR, 'users.csv')))
    errors.push('Missing import-data/metadata/users.csv');
  if (!fs.existsSync(path.join(METADATA_DIR, 'matkul.csv')))
    errors.push('Missing import-data/metadata/matkul.csv');

  if (errors.length) { errors.forEach(e => console.error('✗ ' + e)); process.exit(1); }

  const users = parseCsv(path.join(METADATA_DIR, 'users.csv'));
  const matkuls = parseCsv(path.join(METADATA_DIR, 'matkul.csv'));

  for (const u of users) {
    if (!u.email) errors.push(`users.csv: missing email for "${u.name}"`);
    if (!u.roles) errors.push(`users.csv: missing roles for "${u.name}"`);
  }
  for (const m of matkuls) {
    if (!m.code) errors.push(`matkul.csv: missing code for "${m.name}"`);
    if (!m.sks || isNaN(Number(m.sks))) errors.push(`matkul.csv: invalid sks for "${m.name}"`);
  }

  if (errors.length) {
    errors.forEach(e => console.error('✗ ' + e));
    process.exit(1);
  }

  return { users, matkuls };
}

// ── Log helper ─────────────────────────────────────────────────────────────────

function log(msg: string) { console.log((DRY_RUN ? '[DRY] ' : '') + msg); }

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) console.log('=== DRY RUN — no DB writes, no file copies ===\n');

  const { users: userRows, matkuls: matkulRows } = validate();

  if (!DRY_RUN) fs.mkdirSync(UPLOAD_DEST, { recursive: true });

  // ── Step 1: Upsert Users ────────────────────────────────────────────────────
  console.log('── Step 1: Users');
  const userByName = new Map<string, string>(); // canonical name → userId

  for (const row of userRows) {
    const roles = row.roles.split('|').map(r => r.trim()) as Role[];
    log(`  upsert User: ${row.name} <${row.email}> [${roles.join(', ')}]`);
    if (!DRY_RUN) {
      const user = await prisma.user.upsert({
        where: { email: row.email },
        update: { name: row.name, roles, status: UserStatus.ACTIVE },
        create: { email: row.email, password: row.password || 'dosen123', name: row.name, roles, status: UserStatus.ACTIVE },
      });
      userByName.set(row.name, user.id);
    } else {
      userByName.set(row.name, `[id:${row.name}]`);
    }
  }

  // ── Step 2: Upsert KatalogMatkul ───────────────────────────────────────────
  console.log('\n── Step 2: KatalogMatkul');
  const katalogByName = new Map<string, string>(); // matkul name → katalogId

  for (const row of matkulRows) {
    log(`  upsert KatalogMatkul: ${row.name} (${row.code}, ${row.sks} sks)`);
    if (!DRY_RUN) {
      const k = await prisma.katalogMatkul.upsert({
        where: { code: row.code },
        update: { name: row.name, sks: Number(row.sks) },
        create: { code: row.code, name: row.name, sks: Number(row.sks) },
      });
      katalogByName.set(row.name, k.id);
    } else {
      katalogByName.set(row.name, `[katalog:${row.name}]`);
    }
  }

  // ── Steps 3–8: Walk files/ ─────────────────────────────────────────────────
  let docCount = 0;
  let rpsCount = 0;
  let warnCount = 0;

  for (const yearEntry of fs.readdirSync(FILES_ROOT, { withFileTypes: true })) {
    if (!yearEntry.isDirectory()) continue;
    const yearFolder = yearEntry.name; // e.g. "2024_2025"
    const tahun = yearFolder.replace('_', '/'); // "2024/2025"
    const yearDir = path.join(FILES_ROOT, yearFolder);

    console.log(`\n── Year: ${tahun}`);
    log(`  upsert TahunAkademik: ${tahun}`);

    let tahunId: string;
    if (!DRY_RUN) {
      const ta = await prisma.tahunAkademik.upsert({
        where: { tahun },
        update: {},
        create: { tahun, isActive: false },
      });
      tahunId = ta.id;
    } else {
      tahunId = `[ta:${tahun}]`;
    }

    for (const semEntry of fs.readdirSync(yearDir, { withFileTypes: true })) {
      if (!semEntry.isDirectory()) continue;
      const semName = semEntry.name; // "Genap" | "Ganjil" | "Akselerasi"
      const semDir = path.join(yearDir, semName);

      log(`  upsert Semester: ${semName}`);
      let semId: string;
      if (!DRY_RUN) {
        const sem = await prisma.semester.upsert({
          where: { tahunAkademikId_nama: { tahunAkademikId: tahunId, nama: semName } },
          update: {},
          create: { tahunAkademikId: tahunId, nama: semName, isActive: false },
        });
        semId = sem.id;
      } else {
        semId = `[sem:${semName}]`;
      }

      for (const dosenEntry of fs.readdirSync(semDir, { withFileTypes: true })) {
        if (!dosenEntry.isDirectory()) continue;
        const dosenName = dosenEntry.name;

        if (dosenName.startsWith('_')) {
          console.warn(`  ⚠  Skipping "${dosenName}" (unknown dosen folder)`);
          warnCount++;
          continue;
        }

        const dosenId = userByName.get(dosenName);
        if (!dosenId) {
          console.error(`  ✗  Dosen "${dosenName}" not found in users.csv — skipping folder`);
          warnCount++;
          continue;
        }

        const dosenDir = path.join(semDir, dosenName);

        for (const classEntry of fs.readdirSync(dosenDir, { withFileTypes: true })) {
          if (!classEntry.isDirectory()) continue;
          const folderName = classEntry.name;
          const underscoreIdx = folderName.indexOf('_');
          if (underscoreIdx === -1) {
            console.warn(`  ⚠  Unexpected folder (no underscore): ${folderName}`);
            warnCount++;
            continue;
          }

          const className = folderName.slice(0, underscoreIdx);   // e.g. "22TI1"
          const matkulName = folderName.slice(underscoreIdx + 1); // e.g. "Inovasi Teknologi dan Bisnis"

          const katalogId = katalogByName.get(matkulName);
          if (!katalogId) {
            console.warn(`  ⚠  Matkul "${matkulName}" not in matkul.csv — will create stub KatalogMatkul`);
            warnCount++;
          }

          // Derive matkul code for this semester: use katalog code or generate stub
          const matkulCode = matkulRows.find(r => r.name === matkulName)?.code ?? `STUB_${matkulName.slice(0, 6).replace(/\s/g, '')}`;
          const matkulSks = Number(matkulRows.find(r => r.name === matkulName)?.sks ?? 3);

          log(`    upsert Matkul: ${matkulName} (${matkulCode}) | class ${className} | dosen ${dosenName}`);

          let matkulId: string;
          let matkulClassId: string;

          if (!DRY_RUN) {
            // Upsert stub katalog if missing
            let resolvedKatalogId = katalogId;
            if (!resolvedKatalogId) {
              const stub = await prisma.katalogMatkul.upsert({
                where: { code: matkulCode },
                update: {},
                create: { code: matkulCode, name: matkulName, sks: matkulSks },
              });
              resolvedKatalogId = stub.id;
              katalogByName.set(matkulName, resolvedKatalogId);
            }

            const matkul = await prisma.matkul.upsert({
              where: { code_semesterId: { code: matkulCode, semesterId: semId } },
              update: {},
              create: {
                code: matkulCode,
                name: matkulName,
                sks: matkulSks,
                semesterId: semId,
                katalogMatkulId: resolvedKatalogId,
              },
            });
            matkulId = matkul.id;

            // Connect dosen to matkul
            await prisma.matkul.update({
              where: { id: matkulId },
              data: { dosens: { connect: { id: dosenId } } },
            });

            const mc = await prisma.matkulClass.upsert({
              where: { matkulId_name: { matkulId, name: className } },
              update: {},
              create: { matkulId, name: className },
            });
            matkulClassId = mc.id;

            // Connect dosen to class
            await prisma.matkulClass.update({
              where: { id: matkulClassId },
              data: { dosens: { connect: { id: dosenId } } },
            });
          } else {
            matkulId = `[matkul:${matkulCode}@${semId}]`;
            matkulClassId = `[class:${className}@${matkulId}]`;
          }

          // Process doc files
          const classDir = path.join(dosenDir, folderName);
          for (const fileEntry of fs.readdirSync(classDir, { withFileTypes: true })) {
            if (!fileEntry.isFile()) continue;
            const normalizedName = fileEntry.name.toLowerCase();
            const docType = VALID_DOC_FILES[normalizedName];
            if (!docType) {
              if (!fileEntry.name.startsWith('~$'))
                console.warn(`    ⚠  Unknown file: ${fileEntry.name}`);
              warnCount++;
              continue;
            }

            const srcPath = path.join(classDir, fileEntry.name);
            const destRelDir = `historical/${tahun.replace('/', '_')}/${semName}/${dosenName}`;
            const destFilename = `${className}_${matkulName}_${normalizedName}`;
            const destRelPath = path.join(destRelDir, destFilename);
            const destAbsPath = path.join(UPLOAD_DEST, '..', '..', 'uploads', destRelPath);
            const fileUrl = `/uploads/${destRelPath.replace(/\\/g, '/')}`;

            if (docType === 'RPS') {
              log(`    → RPS (AcademicDoc): ${fileUrl}`);
              if (!DRY_RUN) {
                fs.mkdirSync(path.dirname(destAbsPath), { recursive: true });
                fs.copyFileSync(srcPath, destAbsPath);
                await prisma.academicDocument.upsert({
                  where: { matkulId_dosenId_semesterId_type_matkulClassId: { matkulId, dosenId, semesterId: semId, type: docType as DocType, matkulClassId } },
                  update: { fileUrl, fileName: destFilename, status: DocStatus.APPROVED, isKoordinatorApproved: true, isProdiApproved: true },
                  create: {
                    matkulId,
                    dosenId,
                    semesterId: semId,
                    matkulClassId,
                    type: docType as DocType,
                    fileUrl,
                    fileName: destFilename,
                    status: DocStatus.APPROVED,
                    isKoordinatorApproved: true,
                    isProdiApproved: true,
                  },
                });
              }
              rpsCount++;
            } else {
              log(`    → AcademicDoc [${docType}]: ${fileUrl}`);
              if (!DRY_RUN) {
                fs.mkdirSync(path.dirname(destAbsPath), { recursive: true });
                fs.copyFileSync(srcPath, destAbsPath);
                await prisma.academicDocument.upsert({
                  where: { matkulId_dosenId_semesterId_type_matkulClassId: { matkulId, dosenId, semesterId: semId, type: docType, matkulClassId } },
                  update: { fileUrl, fileName: destFilename, status: DocStatus.APPROVED, isKoordinatorApproved: true, isProdiApproved: true },
                  create: {
                    matkulId,
                    dosenId,
                    semesterId: semId,
                    matkulClassId,
                    type: docType,
                    fileUrl,
                    fileName: destFilename,
                    status: DocStatus.APPROVED,
                    isKoordinatorApproved: true,
                    isProdiApproved: true,
                  },
                });
              }
              docCount++;
            }
          }
        }
      }
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`RPS records:      ${rpsCount}`);
  console.log(`Academic docs:    ${docCount}`);
  console.log(`Warnings/skipped: ${warnCount}`);
  if (DRY_RUN) console.log('\n⚠  Dry run complete — nothing was written.');
  else console.log('\n✓ Import complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect().finally(() => pool.end()));
