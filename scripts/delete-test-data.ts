import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const testEmails = [
  'dosen@test.com', 'dosen2@test.com', 'kaprodi@test.com',
  'koordinator@test.com', 'prodi@test.com',
];

// Delete 2025/2026 Ganjil semester and cascade
const semId = 'cmogwfjzf00079kcu7hez3r6x';
await pool.query(`DELETE FROM "Semester" WHERE id = $1`, [semId]);
console.log('Deleted 2025/2026 Ganjil semester (cascade).');

// Delete docs/RPS belonging to test users first
await pool.query(`DELETE FROM "AcademicDocument" WHERE "dosenId" IN (SELECT id FROM "User" WHERE email = ANY($1::text[]))`, [testEmails]);
await pool.query(`DELETE FROM "RPS" WHERE "dosenId" IN (SELECT id FROM "User" WHERE email = ANY($1::text[]))`, [testEmails]);

// Delete test users
const r = await pool.query(
  `DELETE FROM "User" WHERE email = ANY($1::text[])`,
  [testEmails]
);
console.log(`Deleted ${r.rowCount} test users.`);

// Clean up orphaned TahunAkademik if no semesters left
await pool.query(`
  DELETE FROM "TahunAkademik" ta
  WHERE ta.tahun = '2025/2026'
  AND NOT EXISTS (SELECT 1 FROM "Semester" s WHERE s."tahunAkademikId" = ta.id)
`);
console.log('Cleaned up orphaned TahunAkademik if any.');

await pool.end();
