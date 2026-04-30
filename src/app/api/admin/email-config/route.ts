import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { sendTestEmail } from '@/lib/email';

async function assertAdminOrMaster() {
  const cookieStore = await cookies();
  const raw = cookieStore.get('userRole')?.value || '';
  let roles: string[] = [];
  try { roles = JSON.parse(decodeURIComponent(raw)); } catch { roles = [raw]; }
  if (!roles.includes('ADMIN') && !roles.includes('MASTER')) return false;
  return true;
}

export async function GET() {
  if (!(await assertAdminOrMaster())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }
  const config = await prisma.emailConfig.findUnique({ where: { id: 1 } });
  if (!config) {
    return NextResponse.json({
      id: 1, smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '',
      fromEmail: '', fromName: 'UPH Admin', secure: false, enabled: false,
    });
  }
  return NextResponse.json({
    ...config,
    smtpPass: config.smtpPass ? '********' : '',
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await assertAdminOrMaster())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const body = await req.json();
  const { smtpHost, smtpPort, smtpUser, smtpPass, fromEmail, fromName, secure, enabled } = body;

  const existing = await prisma.emailConfig.findUnique({ where: { id: 1 } });
  const finalPass = smtpPass === '********' ? (existing?.smtpPass ?? '') : (smtpPass ?? '');

  const config = await prisma.emailConfig.upsert({
    where: { id: 1 },
    update: {
      smtpHost: smtpHost ?? '',
      smtpPort: Number(smtpPort) || 587,
      smtpUser: smtpUser ?? '',
      smtpPass: finalPass,
      fromEmail: fromEmail ?? '',
      fromName: fromName || 'UPH Admin',
      secure: Boolean(secure),
      enabled: Boolean(enabled),
    },
    create: {
      id: 1,
      smtpHost: smtpHost ?? '',
      smtpPort: Number(smtpPort) || 587,
      smtpUser: smtpUser ?? '',
      smtpPass: finalPass,
      fromEmail: fromEmail ?? '',
      fromName: fromName || 'UPH Admin',
      secure: Boolean(secure),
      enabled: Boolean(enabled),
    },
  });

  return NextResponse.json({ ...config, smtpPass: config.smtpPass ? '********' : '' });
}

export async function POST(req: NextRequest) {
  if (!(await assertAdminOrMaster())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const { testTo } = await req.json().catch(() => ({}));
  const recipient = testTo || user.email;

  try {
    await sendTestEmail(recipient);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    let msg = 'Gagal mengirim email.';
    if (e instanceof Error) {
      // Surface SMTP-level errors clearly
      if (e.message.includes('Invalid login') || e.message.includes('535') || e.message.includes('Username and Password')) {
        msg = 'Login gagal. Pastikan App Password sudah benar dan 2FA aktif di akun Google.';
      } else if (e.message.includes('ECONNREFUSED') || e.message.includes('ENOTFOUND')) {
        msg = 'Tidak dapat terhubung ke server SMTP. Periksa SMTP Host.';
      } else {
        msg = e.message;
      }
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
