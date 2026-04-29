import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Show test accounts (non-admin/master)
const users = await pool.query(`
  SELECT id, name, email, roles FROM "User"
  WHERE email NOT IN ('admin@test.com', 'master@test.com')
  AND (email LIKE '%@test.com' OR email LIKE '%test%')
  ORDER BY email
`);
console.log('Test accounts to remove:');
console.table(users.rows);

// Show 2025/2026 Ganjil data
const semData = await pool.query(`
  SELECT s.id as semId, ta.tahun, s.nama, COUNT(m.id) as matkul_count
  FROM "Semester" s
  JOIN "TahunAkademik" ta ON s."tahunAkademikId" = ta.id
  LEFT JOIN "Matkul" m ON m."semesterId" = s.id
  WHERE ta.tahun = '2025/2026' AND s.nama = 'Ganjil'
  GROUP BY s.id, ta.tahun, s.nama
`);
console.log('\n2025/2026 Ganjil semester:');
console.table(semData.rows);

await pool.end();
