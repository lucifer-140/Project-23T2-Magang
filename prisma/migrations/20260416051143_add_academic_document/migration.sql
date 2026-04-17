-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('RPS', 'SOAL_UTS', 'SOAL_UAS', 'LPP', 'LPP_TINDAK_LANJUT', 'EPP', 'EPP_TINDAK_LANJUT', 'BERITA_ACARA');

-- CreateEnum
CREATE TYPE "DocStatus" AS ENUM ('UNSUBMITTED', 'SUBMITTED', 'PENGECEKAN', 'REVISION', 'APPROVED');

-- CreateTable
CREATE TABLE "AcademicDocument" (
    "id" TEXT NOT NULL,
    "matkulId" TEXT NOT NULL,
    "dosenId" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "type" "DocType" NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "annotatedPdfUrl" TEXT,
    "status" "DocStatus" NOT NULL DEFAULT 'UNSUBMITTED',
    "isKoordinatorApproved" BOOLEAN NOT NULL DEFAULT false,
    "koordinatorId" TEXT,
    "koordinatorNotes" TEXT,
    "kaprodiNotes" TEXT,
    "koordinatorSigUrl" TEXT,
    "koordinatorSigPage" INTEGER,
    "koordinatorSigX" DOUBLE PRECISION,
    "koordinatorSigY" DOUBLE PRECISION,
    "koordinatorSigWidth" DOUBLE PRECISION,
    "koordinatorSignedPdfUrl" TEXT,
    "kaprodiSigUrl" TEXT,
    "kaprodiSigPage" INTEGER,
    "kaprodiSigX" DOUBLE PRECISION,
    "kaprodiSigY" DOUBLE PRECISION,
    "kaprodiSigWidth" DOUBLE PRECISION,
    "finalPdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicDocAnnotation" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "page" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "color" TEXT NOT NULL DEFAULT '#FFD700',
    "content" TEXT,
    "pathData" TEXT,
    "reviewerRole" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicDocAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AcademicDocument_matkulId_dosenId_semester_type_key" ON "AcademicDocument"("matkulId", "dosenId", "semester", "type");

-- AddForeignKey
ALTER TABLE "AcademicDocument" ADD CONSTRAINT "AcademicDocument_matkulId_fkey" FOREIGN KEY ("matkulId") REFERENCES "Matkul"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicDocument" ADD CONSTRAINT "AcademicDocument_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicDocument" ADD CONSTRAINT "AcademicDocument_koordinatorId_fkey" FOREIGN KEY ("koordinatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicDocAnnotation" ADD CONSTRAINT "AcademicDocAnnotation_docId_fkey" FOREIGN KEY ("docId") REFERENCES "AcademicDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
