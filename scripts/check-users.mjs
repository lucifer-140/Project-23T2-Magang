import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const users = await p.user.findMany({ select: { id: true, name: true, username: true, roles: true } });
console.log(JSON.stringify(users, null, 2));
await p.$disconnect();
