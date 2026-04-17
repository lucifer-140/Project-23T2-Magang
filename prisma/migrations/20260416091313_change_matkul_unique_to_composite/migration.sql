/*
  Warnings:

  - A unique constraint covering the columns `[code,semester,academicYear]` on the table `Matkul` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Matkul_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "Matkul_code_semester_academicYear_key" ON "Matkul"("code", "semester", "academicYear");
