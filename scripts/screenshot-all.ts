/**
 * Screenshot every dashboard page for each user role.
 * Run: npx tsx scripts/screenshot-all.ts
 * Requires: dev server running at http://localhost:3000
 */

import { chromium, Browser, BrowserContext, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.join(process.cwd(), 'screenshots');

// ── Users ─────────────────────────────────────────────────────────────────────

const USERS = [
  {
    role: 'ADMIN',
    email: 'admin@test.com',
    password: 'admin123',
    subdir: 'ADMIN',
  },
  {
    role: 'KAPRODI',
    email: 'kaprodi@test.com',
    password: 'kaprodi123',
    subdir: 'KAPRODI',
  },
  {
    role: 'KOORDINATOR',
    email: 'koordinator@test.com',
    password: 'koordinator123',
    subdir: 'KOORDINATOR',
  },
  {
    role: 'DOSEN',
    email: 'ade.maulana@lecturer.uph.edu',
    password: 'dosen123',
    subdir: 'DOSEN/ade-maulana',
  },
  {
    role: 'DOSEN',
    email: 'adi@lecturer.uph.edu',
    password: 'dosen123',
    subdir: 'DOSEN/adi',
  },
  {
    role: 'DOSEN',
    email: 'aditya.mitra@uph.edu',
    password: 'dosen123',
    subdir: 'DOSEN/aditya-mitra',
  },
];

// ── Route definitions ─────────────────────────────────────────────────────────

type RouteEntry =
  | { type: 'static'; url: string; slug: string }
  | {
      type: 'dynamic';
      slug: string;
      resolve: (ctx: DynamicCtx) => Promise<string | null>;
    };

interface DynamicCtx {
  apiGet: (path: string) => Promise<unknown>;
}

const ROUTES: Record<string, RouteEntry[]> = {
  ADMIN: [
    s('/dashboard/admin', 'admin'),
    s('/dashboard/admin/approvals', 'admin-approvals'),
    s('/dashboard/admin/data-matkul', 'admin-data-matkul'),
    s('/dashboard/admin/email-config', 'admin-email-config'),
    s('/dashboard/admin/kelas', 'admin-kelas'),
    s('/dashboard/admin/matkul', 'admin-matkul'),
    s('/dashboard/admin/users', 'admin-users'),
    {
      type: 'dynamic',
      slug: 'admin-matkul-tahun',
      resolve: async ({ apiGet }) => {
        const data = await apiGet('/api/tahun-akademik');
        const arr = data as { id: string }[];
        if (!arr?.length) return null;
        return `/dashboard/admin/matkul/${arr[0].id}`;
      },
    },
    {
      type: 'dynamic',
      slug: 'admin-matkul-tahun-semester',
      resolve: async ({ apiGet }) => {
        const tahunData = await apiGet('/api/tahun-akademik');
        const tahunArr = tahunData as { id: string }[];
        if (!tahunArr?.length) return null;
        const tahunId = tahunArr[0].id;
        const semData = await apiGet(`/api/tahun-akademik/${tahunId}/semesters`);
        const semArr = semData as { id: string }[];
        if (!semArr?.length) return null;
        return `/dashboard/admin/matkul/${tahunId}/${semArr[0].id}`;
      },
    },
  ],

  KAPRODI: [
    s('/dashboard/kaprodi', 'kaprodi'),
    s('/dashboard/kaprodi/matrix', 'kaprodi-matrix'),
    s('/dashboard/kaprodi/prodi-users', 'kaprodi-prodi-users'),
    s('/dashboard/kaprodi/requests', 'kaprodi-requests'),
    s('/dashboard/matkul', 'matkul'),
    s('/dashboard/prodi', 'prodi'),
    s('/dashboard/settings', 'settings'),
    s('/dashboard/berita-acara', 'berita-acara'),
    {
      type: 'dynamic',
      slug: 'matkul-detail',
      resolve: async ({ apiGet }) => {
        const data = await apiGet('/api/matkul');
        const arr = data as { id: string }[];
        if (!arr?.length) return null;
        return `/dashboard/matkul/${arr[0].id}`;
      },
    },
    {
      type: 'dynamic',
      slug: 'berita-acara-kelas',
      resolve: async ({ apiGet }) => {
        const data = await apiGet('/api/kelas');
        const arr = data as { id: string }[];
        if (!arr?.length) return null;
        return `/dashboard/berita-acara/kelas/${arr[0].id}`;
      },
    },
    {
      type: 'dynamic',
      slug: 'berita-acara-kelas-tahun',
      resolve: async ({ apiGet }) => {
        const kelasData = await apiGet('/api/kelas');
        const kelasArr = kelasData as { id: string }[];
        if (!kelasArr?.length) return null;
        const kelasId = kelasArr[0].id;
        const tahunData = await apiGet('/api/tahun-akademik');
        const tahunArr = tahunData as { id: string }[];
        if (!tahunArr?.length) return null;
        return `/dashboard/berita-acara/kelas/${kelasId}/${tahunArr[0].id}`;
      },
    },
  ],

  KOORDINATOR: [
    s('/dashboard/koordinator', 'koordinator'),
    s('/dashboard/matkul', 'matkul'),
    s('/dashboard/settings', 'settings'),
    s('/dashboard/berita-acara', 'berita-acara'),
    {
      type: 'dynamic',
      slug: 'matkul-detail',
      resolve: async ({ apiGet }) => {
        const data = await apiGet('/api/matkul/mine');
        const arr = data as { id: string }[];
        if (!arr?.length) {
          // fallback to all matkul
          const all = await apiGet('/api/matkul');
          const allArr = all as { id: string }[];
          if (!allArr?.length) return null;
          return `/dashboard/matkul/${allArr[0].id}`;
        }
        return `/dashboard/matkul/${arr[0].id}`;
      },
    },
  ],

  DOSEN: [
    s('/dashboard/dosen', 'dosen'),
    s('/dashboard/matkul', 'matkul'),
    s('/dashboard/settings', 'settings'),
    s('/dashboard/berita-acara', 'berita-acara'),
    {
      type: 'dynamic',
      slug: 'matkul-detail',
      resolve: async ({ apiGet }) => {
        const data = await apiGet('/api/matkul/mine');
        const arr = data as { id: string }[];
        if (!arr?.length) {
          const all = await apiGet('/api/matkul');
          const allArr = all as { id: string }[];
          if (!allArr?.length) return null;
          return `/dashboard/matkul/${allArr[0].id}`;
        }
        return `/dashboard/matkul/${arr[0].id}`;
      },
    },
  ],
};

function s(url: string, slug: string): RouteEntry {
  return { type: 'static', url, slug };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function slugify(email: string) {
  return email.split('@')[0].replace(/\./g, '-');
}

async function login(page: Page, email: string, password: string) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard\//, { timeout: 15000 });
  console.log(`  ✓ Logged in as ${email}`);
}

async function screenshot(page: Page, url: string, outPath: string) {
  try {
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle', timeout: 20000 });
    // Wait a bit for client-side hydration
    await page.waitForTimeout(800);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`    📸 ${url} → ${path.relative(process.cwd(), outPath)}`);
  } catch (err) {
    console.warn(`    ⚠ Skipped ${url}: ${(err as Error).message.split('\n')[0]}`);
  }
}

async function makeApiGet(page: Page) {
  return async (apiPath: string): Promise<unknown> => {
    try {
      const result = await page.evaluate(async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) return null;
        return res.json();
      }, `${BASE_URL}${apiPath}`);
      return result;
    } catch {
      return null;
    }
  };
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting screenshots...\n');
  ensureDir(OUT_DIR);

  const browser: Browser = await chromium.launch({ headless: true });

  for (const user of USERS) {
    console.log(`\n── ${user.role}: ${user.email} ──`);
    const outDir = path.join(OUT_DIR, user.subdir);
    ensureDir(outDir);

    const context: BrowserContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page: Page = await context.newPage();

    try {
      await login(page, user.email, user.password);

      const routes = ROUTES[user.role] ?? [];
      const apiGet = await makeApiGet(page);
      const ctx: DynamicCtx = { apiGet };

      for (const route of routes) {
        if (route.type === 'static') {
          const outPath = path.join(outDir, `${route.slug}.png`);
          await screenshot(page, route.url, outPath);
        } else {
          const url = await route.resolve(ctx);
          if (!url) {
            console.log(`    ⏭ Skipped ${route.slug}: no data available`);
            continue;
          }
          const outPath = path.join(outDir, `${route.slug}.png`);
          await screenshot(page, url, outPath);
        }
      }
    } catch (err) {
      console.error(`  ✗ Failed for ${user.email}: ${(err as Error).message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log(`\n✅ Done. Screenshots saved to: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
