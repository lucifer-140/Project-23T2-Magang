import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

// PATCH /api/notifications/read — mark all as read for current user
export async function PATCH() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  return NextResponse.json({ ok: true });
}
