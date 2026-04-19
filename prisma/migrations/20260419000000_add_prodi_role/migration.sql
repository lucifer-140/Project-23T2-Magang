-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PRODI';

-- AlterTable
ALTER TABLE "AcademicDocument"
  ADD COLUMN "isProdiApproved" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "prodiId" TEXT,
  ADD COLUMN "prodiNotes" TEXT;

-- AddForeignKey
ALTER TABLE "AcademicDocument" ADD CONSTRAINT "AcademicDocument_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
