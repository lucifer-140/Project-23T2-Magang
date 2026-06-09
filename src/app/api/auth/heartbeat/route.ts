import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { IDLE_TIMEOUT_MS, ABSOLUTE_TIMEOUT_MS } from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;
  if (!sessionId) return NextResponse.json({ expired: true }, { status: 401 });

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ expired: true }, { status: 401 });

  const now = Date.now();
  const idle = now - session.lastActivityAt.getTime();
  const age = now - session.createdAt.getTime();

  if (idle > IDLE_TIMEOUT_MS || age > ABSOLUTE_TIMEOUT_MS) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    return NextResponse.json({ expired: true }, { status: 401 });
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { lastActivityAt: new Date() },
  });

  return NextResponse.json({
    ok: true,
    absoluteRemainingMs: ABSOLUTE_TIMEOUT_MS - age,
  });
}
