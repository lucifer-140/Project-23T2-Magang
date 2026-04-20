-- AlterTable
ALTER TABLE "AcademicDocument" ADD COLUMN     "eppPersentaseCpmk" DOUBLE PRECISION,
ADD COLUMN     "eppPersentaseKehadiran" DOUBLE PRECISION,
ADD COLUMN     "eppPersentaseKkmToB" DOUBLE PRECISION,
ADD COLUMN     "eppPersentaseMateri" DOUBLE PRECISION,
ADD COLUMN     "eppPersentaseNilaiB" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "BeritaAcaraPerwalian" (
    "id" TEXT NOT NULL,
    "kelasName" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "dosenPaId" TEXT NOT NULL,
    "lembarKehadiranUrl" TEXT,
    "lembarKehadiranName" TEXT,
    "absensiUrl" TEXT,
    "absensiName" TEXT,
    "beritaAcaraUrl" TEXT,
    "beritaAcaraName" TEXT,
    "status" "DocStatus" NOT NULL DEFAULT 'UNSUBMITTED',
    "isProdiApproved" BOOLEAN NOT NULL DEFAULT false,
    "prodiId" TEXT,
    "prodiNotes" TEXT,
    "kaprodiNotes" TEXT,
    "finalApprovedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeritaAcaraPerwalian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BeritaAcaraPerwalian_kelasName_semesterId_key" ON "BeritaAcaraPerwalian"("kelasName", "semesterId");

-- AddForeignKey
ALTER TABLE "BeritaAcaraPerwalian" ADD CONSTRAINT "BeritaAcaraPerwalian_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeritaAcaraPerwalian" ADD CONSTRAINT "BeritaAcaraPerwalian_dosenPaId_fkey" FOREIGN KEY ("dosenPaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeritaAcaraPerwalian" ADD CONSTRAINT "BeritaAcaraPerwalian_prodiId_fkey" FOREIGN KEY ("prodiId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
