"use client";

import { SWRConfig } from "swr";

/**
 * Global provider wrapper.
 *
 * Place any app-wide React context providers here (SWR, themes, toasts, etc.)
 * and wrap the root layout's children with <Providers>.
 *
 * Usage in src/app/layout.tsx:
 *   import { Providers } from "./providers";
 *   ...
 *   <body>
 *     <Providers>{children}</Providers>
 *   </body>
 */

const swrConfig = {
  /** Re-fetch on window focus (default: true). Disable if your data rarely changes. */
  revalidateOnFocus: false,

  /** Number of retry attempts on error before giving up. */
  errorRetryCount: 3,

  /** Default fetcher: JSON GET. Override per-call when you need POST/auth headers. */
  fetcher: (url: string) =>
    fetch(url).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }),
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
