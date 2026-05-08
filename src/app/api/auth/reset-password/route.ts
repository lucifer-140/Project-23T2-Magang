import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getIpFromRequest } from '@/lib/rate-limit';
import bcrypt from 'bcrypt';

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const rl = checkRateLimit(`reset-password:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    });
  }

  const { token, password } = await req.json();

  if (!token || !password || password.length < 6) {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Link reset tidak valid atau sudah kedaluwarsa.' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}
