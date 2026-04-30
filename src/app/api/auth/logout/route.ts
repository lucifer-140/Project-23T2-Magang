import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('userRole');
  cookieStore.delete('userId');
  cookieStore.delete('userName');
  return NextResponse.json({ ok: true });
}
