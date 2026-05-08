import { headers } from 'next/headers';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Prune expired entries every 10 minutes to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 10 * 60 * 1000);

export interface RateLimitResult {
  ok: boolean;
  retryAfter?: number; // seconds
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { ok: true };
}

/** Extract client IP from Next.js API route request */
export function getIpFromRequest(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

/** Extract client IP inside a Server Action (uses next/headers) */
export async function getIpFromHeaders(): Promise<string> {
  const h = await headers();
  return (
    h.get('x-forwarded-for')?.split(',')[0].trim() ??
    h.get('x-real-ip') ??
    'unknown'
  );
}
