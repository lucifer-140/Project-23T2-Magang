/*
  Warnings:

  - You are about to drop the column `dosenPaId` on the `BeritaAcaraPerwalian` table. All the data in the column will be lost.
  - You are about to drop the column `kelasName` on the `BeritaAcaraPerwalian` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[kelasId,semesterId]` on the table `BeritaAcaraPerwalian` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kelasId` to the `BeritaAcaraPerwalian` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BeritaAcaraPerwalian" DROP CONSTRAINT "BeritaAcaraPerwalian_dosenPaId_fkey";

-- DropIndex
DROP INDEX "BeritaAcaraPerwalian_kelasName_semesterId_key";

-- AlterTable
ALTER TABLE "BeritaAcaraPerwalian" DROP COLUMN "dosenPaId",
DROP COLUMN "kelasName",
ADD COLUMN     "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kelasId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MatkulChangeRequest" ADD COLUMN     "requestedById" TEXT;

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosenPaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_name_key" ON "Kelas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BeritaAcaraPerwalian_kelasId_semesterId_key" ON "BeritaAcaraPerwalian"("kelasId", "semesterId");

-- AddForeignKey
ALTER TABLE "MatkulChangeRequest" ADD CONSTRAINT "MatkulChangeRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_dosenPaId_fkey" FOREIGN KEY ("dosenPaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeritaAcaraPerwalian" ADD CONSTRAINT "BeritaAcaraPerwalian_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
