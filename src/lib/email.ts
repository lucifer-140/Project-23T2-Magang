import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';

async function getEmailConfig() {
  const config = await prisma.emailConfig.findUnique({ where: { id: 1 } });
  if (!config || !config.enabled || !config.smtpHost || !config.fromEmail) return null;
  return config;
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const config = await getEmailConfig();
  if (!config) return; // email disabled or not configured — silent no-op

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.secure,
    requireTLS: !config.secure && config.smtpPort === 587,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  });

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to,
    subject,
    html,
  });
}

function baseTemplate(title: string, body: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f7f9fc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9fc;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #dde3ef;">
        <tr><td style="background:#1a2a4a;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:bold;">Portal Akademik UPH</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#1a2a4a;font-size:18px;">${title}</h2>
          ${body}
          <p style="margin:32px 0 0;color:#9aa0ad;font-size:12px;border-top:1px solid #dde3ef;padding-top:16px;">
            Email ini dikirim otomatis oleh sistem. Jangan balas email ini.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendPendingApprovalEmail(user: { email: string; name: string }) {
  const html = baseTemplate(
    'Pendaftaran Akun Berhasil',
    `<p style="color:#374151;line-height:1.6;">Halo <strong>${user.name}</strong>,</p>
     <p style="color:#374151;line-height:1.6;">Akun Anda telah berhasil didaftarkan ke Portal Akademik UPH. Akun Anda saat ini sedang <strong>menunggu persetujuan</strong> dari Admin.</p>
     <p style="color:#374151;line-height:1.6;">Anda akan menerima email konfirmasi setelah akun Anda disetujui. Harap bersabar dan jangan daftar ulang.</p>`
  );
  await sendEmail({ to: user.email, subject: 'Pendaftaran Akun — Menunggu Persetujuan', html });
}

export async function sendAccountApprovedEmail(user: { email: string; name: string }) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const html = baseTemplate(
    'Akun Anda Telah Disetujui',
    `<p style="color:#374151;line-height:1.6;">Halo <strong>${user.name}</strong>,</p>
     <p style="color:#374151;line-height:1.6;">Selamat! Akun Anda di Portal Akademik UPH telah <strong>disetujui</strong>. Anda sekarang dapat masuk dan menggunakan sistem.</p>
     <p style="margin:24px 0;">
       <a href="${appUrl}" style="background:#1a2a4a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">Masuk ke Portal</a>
     </p>`
  );
  await sendEmail({ to: user.email, subject: 'Akun Disetujui — Portal Akademik UPH', html });
}

export async function sendAccountRejectedEmail(user: { email: string; name: string }) {
  const html = baseTemplate(
    'Pendaftaran Akun Ditolak',
    `<p style="color:#374151;line-height:1.6;">Halo <strong>${user.name}</strong>,</p>
     <p style="color:#374151;line-height:1.6;">Mohon maaf, pendaftaran akun Anda di Portal Akademik UPH <strong>tidak dapat disetujui</strong> saat ini.</p>
     <p style="color:#374151;line-height:1.6;">Untuk informasi lebih lanjut, silakan hubungi Administrator sistem.</p>`
  );
  await sendEmail({ to: user.email, subject: 'Pendaftaran Akun Ditolak — Portal Akademik UPH', html });
}

export async function sendPasswordResetEmail(user: { email: string; name: string }, resetUrl: string) {
  const html = baseTemplate(
    'Reset Password',
    `<p style="color:#374151;line-height:1.6;">Halo <strong>${user.name}</strong>,</p>
     <p style="color:#374151;line-height:1.6;">Kami menerima permintaan untuk mereset password akun Anda. Klik tombol di bawah untuk membuat password baru. Link ini berlaku selama <strong>1 jam</strong>.</p>
     <p style="margin:24px 0;">
       <a href="${resetUrl}" style="background:#b40a1e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">Reset Password</a>
     </p>
     <p style="color:#9aa0ad;font-size:13px;">Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.</p>`
  );
  await sendEmail({ to: user.email, subject: 'Reset Password — Portal Akademik UPH', html });
}

export async function sendTestEmail(to: string) {
  const html = baseTemplate(
    'Konfigurasi Email Berhasil',
    `<p style="color:#374151;line-height:1.6;">Ini adalah email tes dari Portal Akademik UPH.</p>
     <p style="color:#374151;line-height:1.6;">Jika Anda menerima email ini, konfigurasi SMTP Anda sudah benar dan berfungsi.</p>`
  );
  // sendTestEmail bypasses the enabled check — we always try to send for config testing
  const config = await prisma.emailConfig.findUnique({ where: { id: 1 } });
  if (!config || !config.smtpHost || !config.fromEmail) {
    throw new Error('Konfigurasi email belum lengkap.');
  }
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.secure,
    requireTLS: !config.secure && config.smtpPort === 587,
    auth: { user: config.smtpUser, pass: config.smtpPass },
  });
  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromEmail}>`,
    to,
    subject: 'Email Tes — Portal Akademik UPH',
    html,
  });
}
