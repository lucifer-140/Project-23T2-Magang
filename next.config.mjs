/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma v7 + pg require these packages to stay as Node.js server-side modules.
  // Without this, Turbopack tries to bundle them and fails.
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
};

export default nextConfig;
