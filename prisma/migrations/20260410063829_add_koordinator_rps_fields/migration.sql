-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MASTER', 'ADMIN', 'KAPRODI', 'KOORDINATOR', 'DOSEN');

-- CreateEnum
CREATE TYPE "RpsStatus" AS ENUM ('UNSUBMITTED', 'SUBMITTED', 'PENGECEKAN', 'REVISION', 'APPROVED');

-- CreateEnum
CREATE TYPE "ChangeRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roles" "Role"[] DEFAULT ARRAY['DOSEN']::"Role"[],
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Matkul" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Matkul_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatkulChangeRequest" (
    "id" TEXT NOT NULL,
    "matkulId" TEXT NOT NULL,
    "proposedName" TEXT,
    "proposedCode" TEXT,
    "proposedSks" INTEGER,
    "reason" TEXT,
    "status" "ChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatkulChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RPS" (
    "id" TEXT NOT NULL,
    "matkulId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "status" "RpsStatus" NOT NULL DEFAULT 'UNSUBMITTED',
    "notes" TEXT,
    "isKoordinatorApproved" BOOLEAN NOT NULL DEFAULT false,
    "koordinatorId" TEXT,
    "koordinatorNotes" TEXT,
    "kaprodiNotes" TEXT,
    "finalPdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dosenId" TEXT NOT NULL,

    CONSTRAINT "RPS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DosenMatkul" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DosenMatkul_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_KoordinatorMatkul" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KoordinatorMatkul_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Matkul_code_key" ON "Matkul"("code");

-- CreateIndex
CREATE INDEX "_DosenMatkul_B_index" ON "_DosenMatkul"("B");

-- CreateIndex
CREATE INDEX "_KoordinatorMatkul_B_index" ON "_KoordinatorMatkul"("B");

-- AddForeignKey
ALTER TABLE "MatkulChangeRequest" ADD CONSTRAINT "MatkulChangeRequest_matkulId_fkey" FOREIGN KEY ("matkulId") REFERENCES "Matkul"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RPS" ADD CONSTRAINT "RPS_matkulId_fkey" FOREIGN KEY ("matkulId") REFERENCES "Matkul"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RPS" ADD CONSTRAINT "RPS_koordinatorId_fkey" FOREIGN KEY ("koordinatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RPS" ADD CONSTRAINT "RPS_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DosenMatkul" ADD CONSTRAINT "_DosenMatkul_A_fkey" FOREIGN KEY ("A") REFERENCES "Matkul"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DosenMatkul" ADD CONSTRAINT "_DosenMatkul_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KoordinatorMatkul" ADD CONSTRAINT "_KoordinatorMatkul_A_fkey" FOREIGN KEY ("A") REFERENCES "Matkul"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KoordinatorMatkul" ADD CONSTRAINT "_KoordinatorMatkul_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
