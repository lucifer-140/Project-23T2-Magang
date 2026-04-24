/*
  Warnings:

  - You are about to drop the column `matkulId` on the `MatkulChangeRequest` table. All the data in the column will be lost.
  - Added the required column `katalogMatkulId` to the `MatkulChangeRequest` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MatkulChangeRequest" DROP CONSTRAINT "MatkulChangeRequest_matkulId_fkey";

-- AlterTable
ALTER TABLE "Matkul" ADD COLUMN     "katalogMatkulId" TEXT;

-- AlterTable
ALTER TABLE "MatkulChangeRequest" DROP COLUMN "matkulId",
ADD COLUMN     "katalogMatkulId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "KatalogMatkul" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KatalogMatkul_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KatalogMatkul_code_key" ON "KatalogMatkul"("code");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "Matkul" ADD CONSTRAINT "Matkul_katalogMatkulId_fkey" FOREIGN KEY ("katalogMatkulId") REFERENCES "KatalogMatkul"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatkulChangeRequest" ADD CONSTRAINT "MatkulChangeRequest_katalogMatkulId_fkey" FOREIGN KEY ("katalogMatkulId") REFERENCES "KatalogMatkul"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
