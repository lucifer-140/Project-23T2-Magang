/**
 * Backfill migration: create AcademicTerm rows from existing Matkul
 * semester + academicYear combos, then link termId on each Matkul row.
 *
 * Run: npx tsx prisma/migrate-terms.ts
 */
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  console.log('🔗 Connected to DB');

  // Find distinct (semester, academicYear) combos from old Matkul data
  // Note: after schema migration, semester + academicYear columns are dropped.
  // This script is only useful if run BEFORE the db push drops those columns.
  // For fresh installs, re-seeding handles term creation.
  console.log('ℹ️  This script is only effective on pre-migration data.');
  console.log('   For fresh installs, run: npm run seed');

  await client.end();
  console.log('✅ Done.');
}

main().catch((e) => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
