import { NextResponse } from 'next/server';
import { getCurrentUserId, getRoles, unauthorized, forbidden } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  const roles = await getRoles();
  if (!roles.includes('MASTER')) return forbidden();

  let dbOk = false;
  let latencyMs = 0;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    latencyMs = Date.now() - start;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const mem = process.memoryUsage();

  return NextResponse.json({
    db: { ok: dbOk, latencyMs },
    process: {
      memoryMB: Math.round(mem.rss / (1024 * 1024)),
      heapUsedMB: Math.round(mem.heapUsed / (1024 * 1024)),
      heapTotalMB: Math.round(mem.heapTotal / (1024 * 1024)),
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
    },
    env: process.env.NODE_ENV ?? 'unknown',
  });
}
