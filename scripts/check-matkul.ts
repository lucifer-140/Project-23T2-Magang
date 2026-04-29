import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const name = process.argv[2];

if (!name) { console.error('Usage: npx tsx scripts/check-matkul.ts <matkulName>'); process.exit(1); }

const matkul = await pool.query(`
  SELECT m.id, m.name, m.code, s.nama as semester, ta.tahun
  FROM "Matkul" m
  JOIN "Semester" s ON m."semesterId" = s.id
  JOIN "TahunAkademik" ta ON s."tahunAkademikId" = ta.id
  WHERE m.name ILIKE $1
  ORDER BY ta.tahun, s.nama
`, [`%${name}%`]);
console.log('Matkuls found:'); console.table(matkul.rows);

for (const m of matkul.rows) {
  const rps = await pool.query(`
    SELECT r.id, mc.name as class, u.name as dosen, r.status, r."fileUrl"
    FROM "RPS" r
    JOIN "MatkulClass" mc ON r."matkulClassId" = mc.id
    JOIN "User" u ON r."dosenId" = u.id
    WHERE r."matkulId" = $1
  `, [m.id]);
  console.log(`\nRPS for ${m.name} ${m.tahun} ${m.semester} (${m.id}):`);
  console.table(rps.rows);
}

await pool.end();
