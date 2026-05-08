import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) } as never);

const rps = await prisma.rPS.findMany({ select: { fileUrl: true }, take: 5 });
console.log('RPS fileUrls:', JSON.stringify(rps, null, 2));

const docs = await prisma.academicDocument.findMany({ select: { fileUrl: true, type: true }, take: 5 });
console.log('AcademicDoc fileUrls:', JSON.stringify(docs, null, 2));

await prisma.$disconnect();
pool.end();
