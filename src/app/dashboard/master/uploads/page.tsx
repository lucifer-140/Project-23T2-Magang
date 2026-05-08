import { UploadsClient } from './UploadsClient';
import type { UploadsResponse } from '@/lib/api-types';

async function getUploads(): Promise<UploadsResponse> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');

  const res = await fetch(`${base}/api/master/uploads`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });
  if (!res.ok) return { files: [], stats: { totalFiles: 0, totalSizeBytes: 0, totalSizeHuman: '0 B', byFolder: {} } };
  return res.json();
}

export default async function UploadsPage() {
  const initial = await getUploads();
  return <UploadsClient initial={initial} />;
}
