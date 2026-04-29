import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const r = await pool.query(`DELETE FROM "RPS" WHERE "fileUrl" LIKE '/uploads/historical/%'`);
console.log(`Deleted ${r.rowCount} historical RPS records from RPS table.`);
await pool.end();
