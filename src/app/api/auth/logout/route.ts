import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  // Must specify path to match how cookies were set
  cookieStore.set('userRole', '', { path: '/', httpOnly: true, maxAge: 0 });
  cookieStore.set('userId', '', { path: '/', httpOnly: true, maxAge: 0 });
  cookieStore.set('userName', '', { path: '/', httpOnly: true, maxAge: 0 });
  return NextResponse.json({ ok: true });
}
