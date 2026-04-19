// Simple inline seed using raw SQL via pg driver to avoid Prisma config issues
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  console.log('🌱 Seeding via raw SQL...');

  // Clear existing seed data — delete by code to catch any ID variations
  const seedCodes = ['CS101', 'CS202', 'IS204', 'MA105', 'AI301'];
  const { rows: existingMatkuls } = await client.query(
    `SELECT id FROM "Matkul" WHERE code = ANY($1)`, [seedCodes]
  );
  const existingIds = existingMatkuls.map((r: any) => r.id);
  if (existingIds.length > 0) {
    await client.query(`DELETE FROM "RpsAnnotation" WHERE "rpsId" IN (SELECT id FROM "RPS" WHERE "matkulId" = ANY($1))`, [existingIds]);
    await client.query(`DELETE FROM "RPS" WHERE "matkulId" = ANY($1)`, [existingIds]);
    await client.query(`DELETE FROM "AcademicDocAnnotation" WHERE "docId" IN (SELECT id FROM "AcademicDocument" WHERE "matkulId" = ANY($1))`, [existingIds]);
    await client.query(`DELETE FROM "AcademicDocument" WHERE "matkulId" = ANY($1)`, [existingIds]);
    await client.query(`DELETE FROM "MatkulChangeRequest" WHERE "matkulId" = ANY($1)`, [existingIds]);
    await client.query(`DELETE FROM "_DosenMatkul" WHERE "A" = ANY($1)`, [existingIds]);
    await client.query(`DELETE FROM "_KoordinatorMatkul" WHERE "A" = ANY($1)`, [existingIds]);
    await client.query(`DELETE FROM "MatkulClass" WHERE "matkulId" = ANY($1)`, [existingIds]);
    await client.query(`DELETE FROM "Matkul" WHERE id = ANY($1)`, [existingIds]);
  }
  // Clean seed terms
  await client.query(`DELETE FROM "Semester" WHERE id IN ('sem-ganjil-2526', 'sem-genap-2526')`);
  await client.query(`DELETE FROM "TahunAkademik" WHERE id = 'ta-2526'`);
  // Also clean seed RPS/annotations by fixed IDs
  await client.query(`DELETE FROM "RpsAnnotation" WHERE "rpsId" IN ('rps-seed-1','rps-seed-2','rps-seed-3','rps-seed-4','rps-seed-5')`);
  await client.query(`DELETE FROM "RPS" WHERE id IN ('rps-seed-1','rps-seed-2','rps-seed-3','rps-seed-4','rps-seed-5')`);
  console.log('🗑️  Old seed data cleared');

  // Users
  await client.query(`
    INSERT INTO "User" (id, email, password, roles, name, status)
    VALUES
      (gen_random_uuid()::text, 'master@test.com', 'master123', ARRAY['MASTER']::"Role"[], 'System Developer', 'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'admin@test.com', 'admin123', ARRAY['ADMIN']::"Role"[], 'Admin Akademik', 'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'kaprodi@test.com', 'kaprodi123', ARRAY['KAPRODI', 'DOSEN']::"Role"[], 'Dr. Kaprodi Utama', 'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'koordinator@test.com', 'koordinator123', ARRAY['KOORDINATOR', 'DOSEN']::"Role"[], 'Koordinator Prodi', 'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'dosen@test.com', 'dosen123', ARRAY['DOSEN']::"Role"[], 'Dr. Budi Santoso', 'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'dosen2@test.com', 'dosen123', ARRAY['DOSEN']::"Role"[], 'Siti Aminah, M.Kom', 'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'prodi@test.com', 'prodi123', ARRAY['DOSEN', 'PRODI']::"Role"[], 'Dr. Reviewer Prodi', 'ACTIVE'::"UserStatus")
    ON CONFLICT (email) DO NOTHING
  `);
  console.log('✅ Users seeded');

  // Get user IDs
  const { rows: users } = await client.query(`SELECT id, email FROM "User" WHERE email IN ('dosen@test.com', 'dosen2@test.com')`);
  const dosen1Id = users.find((u: any) => u.email === 'dosen@test.com')?.id;
  const dosen2Id = users.find((u: any) => u.email === 'dosen2@test.com')?.id;

  // TahunAkademik + Semester
  await client.query(`
    INSERT INTO "TahunAkademik" (id, tahun, "isActive")
    VALUES ('ta-2526', '2025/2026', true)
    ON CONFLICT (tahun) DO NOTHING
  `);
  await client.query(`
    INSERT INTO "Semester" (id, "tahunAkademikId", nama, "isActive")
    VALUES
      ('sem-ganjil-2526', 'ta-2526', 'Ganjil', true),
      ('sem-genap-2526', 'ta-2526', 'Genap', false)
    ON CONFLICT ("tahunAkademikId", nama) DO NOTHING
  `);
  console.log('✅ TahunAkademik + Semester seeded');

  // Matkul
  await client.query(`
    INSERT INTO "Matkul" (id, code, name, sks, "semesterId", "createdAt", "updatedAt")
    VALUES
      ('matkul-cs101', 'CS101', 'Algoritma & Pemrograman', 3, 'sem-ganjil-2526', NOW(), NOW()),
      ('matkul-cs202', 'CS202', 'Struktur Data', 3, 'sem-ganjil-2526', NOW(), NOW()),
      ('matkul-is204', 'IS204', 'Pemrograman Web', 2, 'sem-genap-2526', NOW(), NOW()),
      ('matkul-ma105', 'MA105', 'Matematika Diskrit', 2, 'sem-genap-2526', NOW(), NOW()),
      ('matkul-ai301', 'AI301', 'Kecerdasan Buatan', 3, 'sem-ganjil-2526', NOW(), NOW())
    ON CONFLICT (code, "semesterId") DO NOTHING
  `);
  console.log('✅ Matkul seeded');

  // Assign dosens to matkul via junction table "_DosenMatkul"
  await client.query(`
    INSERT INTO "_DosenMatkul" ("A", "B")
    VALUES
      ('matkul-cs101', $1),
      ('matkul-cs202', $1),
      ('matkul-ai301', $1),
      ('matkul-is204', $2),
      ('matkul-ma105', $2)
    ON CONFLICT DO NOTHING
  `, [dosen1Id, dosen2Id]);
  console.log('✅ Dosen-Matkul assignments seeded');

  // RPS
  await client.query(`
    INSERT INTO "RPS" (id, "matkulId", "dosenId", status, "fileName", "fileUrl", "createdAt", "updatedAt")
    VALUES
      ('rps-seed-1', 'matkul-cs101', $1, 'SUBMITTED', 'RPS_Algo_2026.pdf', '/uploads/RPS_Algo_2026.pdf', NOW(), NOW()),
      ('rps-seed-2', 'matkul-cs202', $1, 'PENGECEKAN', 'RPS_SD_2026.pdf', '/uploads/RPS_SD_2026.pdf', NOW(), NOW()),
      ('rps-seed-3', 'matkul-ai301', $1, 'APPROVED', 'RPS_AI_V2.pdf', '/uploads/RPS_AI_V2.pdf', NOW(), NOW()),
      ('rps-seed-4', 'matkul-is204', $2, 'REVISION', 'RPS_Web_v1.pdf', '/uploads/RPS_Web_v1.pdf', NOW(), NOW()),
      ('rps-seed-5', 'matkul-ma105', $2, 'UNSUBMITTED', NULL, NULL, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `, [dosen1Id, dosen2Id]);
  
  await client.query(`
    UPDATE "RPS" SET notes = 'Format tabel evaluasi tidak sesuai dengan standar universitas terbaru.' WHERE id = 'rps-seed-4'
  `);
  console.log('✅ RPS seeded');

  // MatkulChangeRequest
  await client.query(`
    INSERT INTO "MatkulChangeRequest" (id, "matkulId", "proposedSks", "proposedName", reason, status, "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, 'matkul-is204', 3, 'Pemrograman Web Lanjutan', 'Kurikulum diperbarui, SKS perlu ditingkatkan.', 'PENDING', NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);
  console.log('✅ Change request seeded');

  console.log('\n🎉 Seed complete!');
  console.log('Test accounts: master@test.com | admin@test.com | kaprodi@test.com | koordinator@test.com | dosen@test.com | dosen2@test.com | prodi@test.com');
  console.log('Passwords: [email prefix]123 (dosen2 uses dosen123)');
}

main()
  .catch((e) => { console.error('Seed failed:', e.message); process.exit(1); })
  .finally(() => client.end());
