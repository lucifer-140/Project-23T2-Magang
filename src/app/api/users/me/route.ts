import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, roles: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, email, currentPassword, newPassword } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updateData: { name?: string; email?: string; password?: string } = {};

  if (name && name !== user.name) updateData.name = name;

  if (email && email !== user.email) {
    const conflict = await prisma.user.findUnique({ where: { email } });
    if (conflict) return NextResponse.json({ error: 'Email sudah digunakan.' }, { status: 409 });
    updateData.email = email;
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Password lama diperlukan.' }, { status: 400 });
    }
    if (user.password !== currentPassword) {
      return NextResponse.json({ error: 'Password lama salah.' }, { status: 400 });
    }
    updateData.password = newPassword;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Tidak ada perubahan.' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, roles: true },
  });

  // Refresh userName cookie if name changed
  if (updateData.name) {
    cookieStore.set('userName', updateData.name, { path: '/', httpOnly: false, sameSite: 'lax' });
  }

  return NextResponse.json(updated);
}
