-- AlterTable
ALTER TABLE "Matkul" ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "semester" TEXT;

-- CreateTable
CREATE TABLE "MatkulClass" (
    "id" TEXT NOT NULL,
    "matkulId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MatkulClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClassDosen" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClassDosen_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatkulClass_matkulId_name_key" ON "MatkulClass"("matkulId", "name");

-- CreateIndex
CREATE INDEX "_ClassDosen_B_index" ON "_ClassDosen"("B");

-- AddForeignKey
ALTER TABLE "MatkulClass" ADD CONSTRAINT "MatkulClass_matkulId_fkey" FOREIGN KEY ("matkulId") REFERENCES "Matkul"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassDosen" ADD CONSTRAINT "_ClassDosen_A_fkey" FOREIGN KEY ("A") REFERENCES "MatkulClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassDosen" ADD CONSTRAINT "_ClassDosen_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
