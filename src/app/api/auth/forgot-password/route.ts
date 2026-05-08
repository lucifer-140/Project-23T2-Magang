import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit, getIpFromRequest } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const ip = getIpFromRequest(req);
  const rl = checkRateLimit(`forgot-password:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    });
  }

  const { email } = await req.json();

  // Always return 200 to prevent email enumeration
  if (!email) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== 'ACTIVE') return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.upsert({
    where: { userId: user.id },
    update: { token, expiresAt },
    create: { token, userId: user.id, expiresAt },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  // Fire-and-forget — don't block response if email fails
  sendPasswordResetEmail(user, resetUrl).catch(() => {});

  return NextResponse.json({ ok: true });
}
