-- DropForeignKey
ALTER TABLE "Kelas" DROP CONSTRAINT "Kelas_dosenPaId_fkey";

-- AlterTable
ALTER TABLE "Kelas" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "dosenPaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MatkulClass" ADD COLUMN     "kelasId" TEXT;

-- AlterTable
ALTER TABLE "RPS" ADD COLUMN     "annotatedPdfUrl" TEXT;

-- CreateTable
CREATE TABLE "EmailConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "smtpHost" TEXT NOT NULL DEFAULT '',
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpUser" TEXT NOT NULL DEFAULT '',
    "smtpPass" TEXT NOT NULL DEFAULT '',
    "fromEmail" TEXT NOT NULL DEFAULT '',
    "fromName" TEXT NOT NULL DEFAULT 'UPH Admin',
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_userId_key" ON "PasswordResetToken"("userId");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatkulClass" ADD CONSTRAINT "MatkulClass_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_dosenPaId_fkey" FOREIGN KEY ("dosenPaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "AcademicDocument_matkulId_dosenId_semesterId_type_matkulClassId" RENAME TO "AcademicDocument_matkulId_dosenId_semesterId_type_matkulCla_key";
