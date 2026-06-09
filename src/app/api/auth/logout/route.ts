import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
  const clear = { path: '/', httpOnly: true, maxAge: 0 };
  cookieStore.set('sessionId', '', clear);
  cookieStore.set('userRole', '', clear);
  cookieStore.set('userId', '', clear);
  cookieStore.set('userName', '', clear);
  return NextResponse.json({ ok: true });
}
