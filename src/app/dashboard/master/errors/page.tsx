import { ErrorsClient } from './ErrorsClient';
import type { LogEntry } from '@/lib/api-types';

async function getErrorLogs(): Promise<LogEntry[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');

  const res = await fetch(`${base}/api/logs?level=ERROR&source=system&limit=200`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function ErrorsPage() {
  const initialLogs = await getErrorLogs();
  return <ErrorsClient initialLogs={initialLogs} />;
}
