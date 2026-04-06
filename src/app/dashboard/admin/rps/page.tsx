import { redirect } from 'next/navigation';

// The old admin/rps page is now handled by kaprodi/rps
// Admin no longer reviews RPS - that's Kaprodi's role
export default function AdminRPSRedirect() {
  redirect('/dashboard/admin');
}
