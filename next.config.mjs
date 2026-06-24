/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma v7 + pg require these packages to stay as Node.js server-side modules.
  // Without this, Turbopack tries to bundle them and fails.
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg', 'puppeteer', 'mammoth'],

  // Exclude public/uploads from output file tracing — on VPS it's a symlink to
  // /data/uph-uploads/ (outside project root) which causes Turbopack to panic.
  // Nginx serves /uploads/ directly via alias so Next.js doesn't need to trace it.
  outputFileTracingExcludes: {
    '*': ['./public/uploads/**'],
  },
};

export default nextConfig;
