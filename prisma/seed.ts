import pg from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  console.log('🌱 Seeding test accounts...');

  const accounts = [
    { email: 'master@test.com',       password: 'master123',       roles: ['MASTER'],                name: 'System Developer' },
    { email: 'admin@test.com',        password: 'admin123',        roles: ['ADMIN'],                 name: 'Admin Akademik' },
    { email: 'kaprodi@test.com',      password: 'kaprodi123',      roles: ['KAPRODI', 'DOSEN'],      name: 'Dr. Kaprodi Utama' },
    { email: 'koordinator@test.com',  password: 'koordinator123',  roles: ['KOORDINATOR', 'DOSEN'],  name: 'Koordinator Prodi' },
    { email: 'dosen@test.com',        password: 'dosen123',        roles: ['DOSEN'],                 name: 'Dr. Budi Santoso' },
    { email: 'dosen2@test.com',       password: 'dosen123',        roles: ['DOSEN'],                 name: 'Siti Aminah, M.Kom' },
    { email: 'prodi@test.com',        password: 'prodi123',        roles: ['DOSEN', 'PRODI'],        name: 'Dr. Reviewer Prodi' },
  ];

  for (const account of accounts) {
    const hash = await bcrypt.hash(account.password, 12);
    await client.query(
      `INSERT INTO "User" (id, email, password, roles, name, status)
       VALUES (gen_random_uuid()::text, $1, $2, $3::"Role"[], $4, 'ACTIVE'::"UserStatus")
       ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password`,
      [account.email, hash, account.roles, account.name]
    );
  }
  console.log('✅ Users seeded');

  console.log('\n🎉 Seed complete!');
  console.log('Accounts: master | admin | kaprodi | koordinator | dosen | dosen2 | prodi @test.com');
  console.log('Passwords: [role]123 (dosen2 uses dosen123)');
}

main()
  .catch((e) => { console.error('Seed failed:', e.message); process.exit(1); })
  .finally(() => client.end());
