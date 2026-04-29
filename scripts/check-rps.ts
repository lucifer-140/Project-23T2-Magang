import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const r = await pool.query(`
  SELECT ta.tahun, s.nama AS semester, m.name AS matkul, mc.name AS class,
         u.name AS dosen, r."fileUrl", r.status
  FROM "RPS" r
  JOIN "Matkul" m ON r."matkulId" = m.id
  JOIN "MatkulClass" mc ON r."matkulClassId" = mc.id
  JOIN "User" u ON r."dosenId" = u.id
  JOIN "Semester" s ON m."semesterId" = s.id
  JOIN "TahunAkademik" ta ON s."tahunAkademikId" = ta.id
  ORDER BY ta.tahun, s.nama, m.name, mc.name
`);

console.table(r.rows);
console.log(`\nTotal RPS records: ${r.rows.length}`);

await pool.end();
