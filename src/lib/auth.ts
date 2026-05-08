import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
};
