-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('INFO', 'WARN', 'DEBUG', 'ERROR');

-- CreateTable
CREATE TABLE "SystemLog" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL,
    "route" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "userId" TEXT,
    "stack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemLog_level_createdAt_idx" ON "SystemLog"("level", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "SystemLog_route_idx" ON "SystemLog"("route");
