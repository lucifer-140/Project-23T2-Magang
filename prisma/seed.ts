import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

const KATALOG_IDS = [
  'katmatkul-if101',
  'katmatkul-if201',
  'katmatkul-if202',
  'katmatkul-if301',
  'katmatkul-if302',
  'katmatkul-if303',
  'katmatkul-if401',
  'katmatkul-if402',
  'katmatkul-if403',
  'katmatkul-ma101',
  'katmatkul-ma201',
  'katmatkul-sc101',
];

const MATKUL_IDS = [
  'matkul-if201',
  'matkul-if202',
  'matkul-if401',
  'matkul-if302',
  'matkul-ma201',
];

async function main() {
  await client.connect();
  console.log('🌱 Seeding via raw SQL...');

  // ── Clear old seed data ──────────────────────────────────────────────────────
  await client.query(`DELETE FROM "RpsAnnotation" WHERE "rpsId" IN ('rps-seed-1','rps-seed-2','rps-seed-3','rps-seed-4','rps-seed-5')`);
  await client.query(`DELETE FROM "RPS" WHERE id IN ('rps-seed-1','rps-seed-2','rps-seed-3','rps-seed-4','rps-seed-5')`);

  const { rows: existingMatkuls } = await client.query(
    `SELECT id FROM "Matkul" WHERE id = ANY($1)`, [MATKUL_IDS]
  );
  const existingIds = existingMatkuls.map((r: any) => r.id);
  if (existingIds.length > 0) {
    await client.query(`DELETE FROM "AcademicDocAnnotation" WHERE "docId" IN (SELECT id FROM "AcademicDocument" WHERE "matkulId" = ANY($1))`, [existingIds]);
    await client.query(`DELETE FROM "AcademicDocument" WHERE "matkulId" = ANY($1)`, [existingIds]);
    await client.query(`DELETE FROM "_DosenMatkul" WHERE "A" = ANY($1)`, [existingIds]);
    await client.query(`DELETE FROM "_KoordinatorMatkul" WHERE "A" = ANY($1)`, [existingIds]);
    await client.query(`DELETE FROM "MatkulClass" WHERE "matkulId" = ANY($1)`, [existingIds]);
    await client.query(`DELETE FROM "Matkul" WHERE id = ANY($1)`, [existingIds]);
  }

  await client.query(`DELETE FROM "MatkulChangeRequest" WHERE "katalogMatkulId" = ANY($1)`, [KATALOG_IDS]);
  await client.query(`DELETE FROM "KatalogMatkul" WHERE id = ANY($1)`, [KATALOG_IDS]);
  await client.query(`DELETE FROM "Semester" WHERE id IN ('sem-ganjil-2526', 'sem-genap-2526')`);
  await client.query(`DELETE FROM "TahunAkademik" WHERE id = 'ta-2526'`);
  console.log('🗑️  Old seed data cleared');

  // ── Users ────────────────────────────────────────────────────────────────────
  await client.query(`
    INSERT INTO "User" (id, email, password, roles, name, status)
    VALUES
      (gen_random_uuid()::text, 'master@test.com',       'master123',       ARRAY['MASTER']::"Role"[],                'System Developer',      'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'admin@test.com',        'admin123',        ARRAY['ADMIN']::"Role"[],                 'Admin Akademik',         'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'kaprodi@test.com',      'kaprodi123',      ARRAY['KAPRODI', 'DOSEN']::"Role"[],      'Dr. Kaprodi Utama',      'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'koordinator@test.com',  'koordinator123',  ARRAY['KOORDINATOR', 'DOSEN']::"Role"[],  'Koordinator Prodi',      'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'dosen@test.com',        'dosen123',        ARRAY['DOSEN']::"Role"[],                 'Dr. Budi Santoso',       'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'dosen2@test.com',       'dosen123',        ARRAY['DOSEN']::"Role"[],                 'Siti Aminah, M.Kom',     'ACTIVE'::"UserStatus"),
      (gen_random_uuid()::text, 'prodi@test.com',        'prodi123',        ARRAY['DOSEN', 'PRODI']::"Role"[],        'Dr. Reviewer Prodi',     'ACTIVE'::"UserStatus")
    ON CONFLICT (email) DO NOTHING
  `);
  console.log('✅ Users seeded');

  const { rows: users } = await client.query(
    `SELECT id, email FROM "User" WHERE email IN ('dosen@test.com', 'dosen2@test.com')`
  );
  const dosen1Id = users.find((u: any) => u.email === 'dosen@test.com')?.id;
  const dosen2Id = users.find((u: any) => u.email === 'dosen2@test.com')?.id;

  // ── KatalogMatkul ────────────────────────────────────────────────────────────
  await client.query(`
    INSERT INTO "KatalogMatkul" (id, code, name, sks, "createdAt", "updatedAt")
    VALUES
      ('katmatkul-if101', 'IF101', 'Pengantar Teknologi Informasi', 2, NOW(), NOW()),
      ('katmatkul-if201', 'IF201', 'Algoritma & Pemrograman',       3, NOW(), NOW()),
      ('katmatkul-if202', 'IF202', 'Struktur Data',                 3, NOW(), NOW()),
      ('katmatkul-if301', 'IF301', 'Basis Data',                    3, NOW(), NOW()),
      ('katmatkul-if302', 'IF302', 'Pemrograman Web',               3, NOW(), NOW()),
      ('katmatkul-if303', 'IF303', 'Jaringan Komputer',             3, NOW(), NOW()),
      ('katmatkul-if401', 'IF401', 'Kecerdasan Buatan',             3, NOW(), NOW()),
      ('katmatkul-if402', 'IF402', 'Rekayasa Perangkat Lunak',      3, NOW(), NOW()),
      ('katmatkul-if403', 'IF403', 'Keamanan Informasi',            3, NOW(), NOW()),
      ('katmatkul-ma101', 'MA101', 'Kalkulus',                      3, NOW(), NOW()),
      ('katmatkul-ma201', 'MA201', 'Matematika Diskrit',            3, NOW(), NOW()),
      ('katmatkul-sc101', 'SC101', 'Kapita Selekta',                2, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING
  `);
  console.log('✅ KatalogMatkul seeded (12 entries)');

  // ── TahunAkademik + Semester ─────────────────────────────────────────────────
  await client.query(`
    INSERT INTO "TahunAkademik" (id, tahun, "isActive")
    VALUES ('ta-2526', '2025/2026', true)
    ON CONFLICT (tahun) DO NOTHING
  `);
  await client.query(`
    INSERT INTO "Semester" (id, "tahunAkademikId", nama, "isActive")
    VALUES
      ('sem-ganjil-2526', 'ta-2526', 'Ganjil', true),
      ('sem-genap-2526',  'ta-2526', 'Genap',  false)
    ON CONFLICT ("tahunAkademikId", nama) DO NOTHING
  `);
  console.log('✅ TahunAkademik + Semester seeded');

  // ── Matkul (semester instances, linked to catalog) ───────────────────────────
  await client.query(`
    INSERT INTO "Matkul" (id, code, name, sks, "semesterId", "katalogMatkulId", "createdAt", "updatedAt")
    VALUES
      ('matkul-if201', 'IF201', 'Algoritma & Pemrograman', 3, 'sem-ganjil-2526', 'katmatkul-if201', NOW(), NOW()),
      ('matkul-if202', 'IF202', 'Struktur Data',           3, 'sem-ganjil-2526', 'katmatkul-if202', NOW(), NOW()),
      ('matkul-if401', 'IF401', 'Kecerdasan Buatan',       3, 'sem-ganjil-2526', 'katmatkul-if401', NOW(), NOW()),
      ('matkul-if302', 'IF302', 'Pemrograman Web',         3, 'sem-genap-2526',  'katmatkul-if302', NOW(), NOW()),
      ('matkul-ma201', 'MA201', 'Matematika Diskrit',      3, 'sem-genap-2526',  'katmatkul-ma201', NOW(), NOW())
    ON CONFLICT (code, "semesterId") DO NOTHING
  `);
  console.log('✅ Matkul (semester instances) seeded');

  // ── Dosen assignments ────────────────────────────────────────────────────────
  await client.query(`
    INSERT INTO "_DosenMatkul" ("A", "B")
    VALUES
      ('matkul-if201', $1),
      ('matkul-if202', $1),
      ('matkul-if401', $1),
      ('matkul-if302', $2),
      ('matkul-ma201', $2)
    ON CONFLICT DO NOTHING
  `, [dosen1Id, dosen2Id]);
  console.log('✅ Dosen-Matkul assignments seeded');

  // ── RPS ──────────────────────────────────────────────────────────────────────
  await client.query(`
    INSERT INTO "RPS" (id, "matkulId", "dosenId", status, "fileName", "fileUrl", "createdAt", "updatedAt")
    VALUES
      ('rps-seed-1', 'matkul-if201', $1, 'SUBMITTED',    'RPS_Algo_2026.pdf',  '/uploads/RPS_Algo_2026.pdf',  NOW(), NOW()),
      ('rps-seed-2', 'matkul-if202', $1, 'PENGECEKAN',   'RPS_SD_2026.pdf',    '/uploads/RPS_SD_2026.pdf',    NOW(), NOW()),
      ('rps-seed-3', 'matkul-if401', $1, 'APPROVED',     'RPS_AI_V2.pdf',      '/uploads/RPS_AI_V2.pdf',      NOW(), NOW()),
      ('rps-seed-4', 'matkul-if302', $2, 'REVISION',     'RPS_Web_v1.pdf',     '/uploads/RPS_Web_v1.pdf',     NOW(), NOW()),
      ('rps-seed-5', 'matkul-ma201', $2, 'UNSUBMITTED',  NULL,                 NULL,                          NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `, [dosen1Id, dosen2Id]);
  await client.query(`
    UPDATE "RPS" SET notes = 'Format tabel evaluasi tidak sesuai dengan standar universitas terbaru.' WHERE id = 'rps-seed-4'
  `);
  console.log('✅ RPS seeded');

  // ── Demo MatkulChangeRequest (pending, targeting katalog) ─────────────────────
  await client.query(`
    INSERT INTO "MatkulChangeRequest" (id, "katalogMatkulId", "proposedSks", "proposedName", reason, status, "createdAt", "updatedAt")
    VALUES (
      gen_random_uuid()::text,
      'katmatkul-if302',
      4,
      'Pemrograman Web Lanjutan',
      'Kurikulum diperbarui — cakupan materi bertambah signifikan, SKS perlu ditingkatkan.',
      'PENDING',
      NOW(), NOW()
    )
  `);
  console.log('✅ Demo MatkulChangeRequest seeded');

  console.log('\n🎉 Seed complete!');
  console.log('Accounts: master | admin | kaprodi | koordinator | dosen | dosen2 | prodi @test.com');
  console.log('Passwords: [role]123 (dosen2 uses dosen123)');
}

main()
  .catch((e) => { console.error('Seed failed:', e.message); process.exit(1); })
  .finally(() => client.end());
