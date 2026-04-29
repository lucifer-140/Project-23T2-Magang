-- Add EPP_UTS and EPP_UAS to DocType enum
ALTER TYPE "DocType" ADD VALUE 'EPP_UTS';
ALTER TYPE "DocType" ADD VALUE 'EPP_UAS';

-- Add matkulClassId to RPS
ALTER TABLE "RPS" ADD COLUMN "matkulClassId" TEXT;
ALTER TABLE "RPS" ADD CONSTRAINT "RPS_matkulClassId_fkey" FOREIGN KEY ("matkulClassId") REFERENCES "MatkulClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old implicit uniqueness (no constraint existed) and add explicit unique on RPS
CREATE UNIQUE INDEX "RPS_matkulId_dosenId_matkulClassId_key" ON "RPS"("matkulId", "dosenId", "matkulClassId");

-- Add matkulClassId to AcademicDocument
ALTER TABLE "AcademicDocument" ADD COLUMN "matkulClassId" TEXT;
ALTER TABLE "AcademicDocument" ADD CONSTRAINT "AcademicDocument_matkulClassId_fkey" FOREIGN KEY ("matkulClassId") REFERENCES "MatkulClass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop old unique constraint on AcademicDocument and add new one with matkulClassId
DROP INDEX "AcademicDocument_matkulId_dosenId_semesterId_type_key";
CREATE UNIQUE INDEX "AcademicDocument_matkulId_dosenId_semesterId_type_matkulClassId_key" ON "AcademicDocument"("matkulId", "dosenId", "semesterId", "type", "matkulClassId");
