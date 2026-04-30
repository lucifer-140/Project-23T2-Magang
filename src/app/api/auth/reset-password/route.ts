import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || !password || password.length < 6) {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Link reset tidak valid atau sudah kedaluwarsa.' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}
