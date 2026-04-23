'use client';

import dynamic from 'next/dynamic';

const KaprodiDashboardClient = dynamic(() => import('./KaprodiDashboardClient'), { ssr: false });

export default function KaprodiDashboardWrapper() {
  return <KaprodiDashboardClient />;
}
