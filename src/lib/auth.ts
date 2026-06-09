import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const IDLE_TIMEOUT_MS = 60 * 60 * 1000;       // 60 minutes
export const ABSOLUTE_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours
export const WARNING_BEFORE_MS = 2 * 60 * 1000;       // warn at 58-min mark

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('userId')?.value ?? null;
}

export async function getRoles(): Promise<string[]> {
  const cookieStore = await cookies();
  const roleRaw = cookieStore.get('userRole')?.value;
  if (!roleRaw) return [];
  try {
    const decoded = decodeURIComponent(roleRaw);
    const parsed = JSON.parse(decoded);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return roleRaw ? [roleRaw] : [];
  }
}

export async function validateSession(): Promise<{ userId: string; sessionId: string } | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId')?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return null;

  const now = Date.now();
  const idle = now - session.lastActivityAt.getTime();
  const age = now - session.createdAt.getTime();

  if (idle > IDLE_TIMEOUT_MS || age > ABSOLUTE_TIMEOUT_MS) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
    return null;
  }

  return { userId: session.userId, sessionId };
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export const SESSION_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};
