import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  console.log('🌱 Seeding test accounts...');

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

  console.log('\n🎉 Seed complete!');
  console.log('Accounts: master | admin | kaprodi | koordinator | dosen | dosen2 | prodi @test.com');
  console.log('Passwords: [role]123 (dosen2 uses dosen123)');
}

main()
  .catch((e) => { console.error('Seed failed:', e.message); process.exit(1); })
  .finally(() => client.end());
