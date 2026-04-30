import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
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
