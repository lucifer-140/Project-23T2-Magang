import { PrismaClient } from "@prisma/client";
import config from "../../prisma.config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// @ts-ignore
export const prisma = globalForPrisma.prisma ?? new PrismaClient(config as any);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
