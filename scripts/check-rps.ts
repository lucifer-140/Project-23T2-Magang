import { prisma } from '../src/lib/db';

const rows = await prisma.rPS.findMany({
  select: { matkulClassId: true, fileUrl: true, fileName: true },
  take: 5,
});
console.log(JSON.stringify(rows, null, 2));

const nullClass = await prisma.rPS.count({ where: { matkulClassId: null } });
const total = await prisma.rPS.count();
console.log(`total=${total} nullMatkulClassId=${nullClass}`);
process.exit(0);
