-- CreateTable TahunAkademik
CREATE TABLE IF NOT EXISTS "TahunAkademik" (
    "id" TEXT NOT NULL,
    "tahun" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TahunAkademik_pkey" PRIMARY KEY ("id")
);

-- CreateTable Semester
CREATE TABLE IF NOT EXISTS "Semester" (
    "id" TEXT NOT NULL,
    "tahunAkademikId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Semester_pkey" PRIMARY KEY ("id")
);

-- CreateIndex unique on TahunAkademik.tahun
CREATE UNIQUE INDEX IF NOT EXISTS "TahunAkademik_tahun_key" ON "TahunAkademik"("tahun");

-- CreateIndex unique on Semester
CREATE UNIQUE INDEX IF NOT EXISTS "Semester_tahunAkademikId_nama_key" ON "Semester"("tahunAkademikId", "nama");

-- AddForeignKey Semester -> TahunAkademik
ALTER TABLE "Semester" DROP CONSTRAINT IF EXISTS "Semester_tahunAkademikId_fkey";
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_tahunAkademikId_fkey"
    FOREIGN KEY ("tahunAkademikId") REFERENCES "TahunAkademik"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Matkul: add semesterId, drop old columns
ALTER TABLE "Matkul" ADD COLUMN IF NOT EXISTS "semesterId" TEXT;
DROP INDEX IF EXISTS "Matkul_code_semester_academicYear_key";
DROP INDEX IF EXISTS "Matkul_code_key";
ALTER TABLE "Matkul" DROP COLUMN IF EXISTS "semester";
ALTER TABLE "Matkul" DROP COLUMN IF EXISTS "academicYear";

-- CreateIndex unique on Matkul(code, semesterId)
CREATE UNIQUE INDEX IF NOT EXISTS "Matkul_code_semesterId_key" ON "Matkul"("code", "semesterId");

-- AddForeignKey Matkul -> Semester
ALTER TABLE "Matkul" DROP CONSTRAINT IF EXISTS "Matkul_semesterId_fkey";
ALTER TABLE "Matkul" ADD CONSTRAINT "Matkul_semesterId_fkey"
    FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AcademicDocument: add semesterId, drop old semester column
ALTER TABLE "AcademicDocument" ADD COLUMN IF NOT EXISTS "semesterId" TEXT;
DROP INDEX IF EXISTS "AcademicDocument_matkulId_dosenId_semester_type_key";
ALTER TABLE "AcademicDocument" DROP COLUMN IF EXISTS "semester";

-- CreateIndex unique on AcademicDocument(matkulId, dosenId, semesterId, type)
CREATE UNIQUE INDEX IF NOT EXISTS "AcademicDocument_matkulId_dosenId_semesterId_type_key"
    ON "AcademicDocument"("matkulId", "dosenId", "semesterId", "type");

-- AddForeignKey AcademicDocument -> Semester
ALTER TABLE "AcademicDocument" DROP CONSTRAINT IF EXISTS "AcademicDocument_semesterId_fkey";
ALTER TABLE "AcademicDocument" ADD CONSTRAINT "AcademicDocument_semesterId_fkey"
    FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE SET NULL ON UPDATE CASCADE;
