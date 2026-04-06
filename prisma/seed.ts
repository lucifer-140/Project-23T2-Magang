// Simple inline seed using raw SQL via pg driver to avoid Prisma config issues
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  console.log('🌱 Seeding via raw SQL...');

  // Users
  await client.query(`
    INSERT INTO "User" (id, username, password, role, name)
    VALUES
      (gen_random_uuid()::text, 'master', 'master123', 'MASTER', 'System Developer'),
      (gen_random_uuid()::text, 'admin', 'admin123', 'ADMIN', 'Admin Akademik'),
      (gen_random_uuid()::text, 'kaprodi', 'kaprodi123', 'KAPRODI', 'Dr. Kaprodi Utama'),
      (gen_random_uuid()::text, 'koordinator', 'koordinator123', 'KOORDINATOR', 'Koordinator Prodi'),
      (gen_random_uuid()::text, 'dosen', 'dosen123', 'DOSEN', 'Dr. Budi Santoso'),
      (gen_random_uuid()::text, 'dosen2', 'dosen123', 'DOSEN', 'Siti Aminah, M.Kom')
    ON CONFLICT (username) DO NOTHING
  `);
  console.log('✅ Users seeded');

  // Get user IDs
  const { rows: users } = await client.query(`SELECT id, username FROM "User" WHERE username IN ('dosen', 'dosen2')`);
  const dosen1Id = users.find((u: any) => u.username === 'dosen')?.id;
  const dosen2Id = users.find((u: any) => u.username === 'dosen2')?.id;

  // Matkul
  await client.query(`
    INSERT INTO "Matkul" (id, code, name, sks, "createdAt", "updatedAt")
    VALUES
      ('matkul-cs101', 'CS101', 'Algoritma & Pemrograman', 3, NOW(), NOW()),
      ('matkul-cs202', 'CS202', 'Struktur Data', 3, NOW(), NOW()),
      ('matkul-is204', 'IS204', 'Pemrograman Web', 2, NOW(), NOW()),
      ('matkul-ma105', 'MA105', 'Matematika Diskrit', 2, NOW(), NOW()),
      ('matkul-ai301', 'AI301', 'Kecerdasan Buatan', 3, NOW(), NOW())
    ON CONFLICT (code) DO NOTHING
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
  console.log('Test accounts: master | admin | kaprodi | koordinator | dosen | dosen2');
  console.log('Passwords: [username]123 (dosen2 uses dosen123)');
}

main()
  .catch((e) => { console.error('Seed failed:', e.message); process.exit(1); })
  .finally(() => client.end());
