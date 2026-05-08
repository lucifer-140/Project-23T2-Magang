-- DropForeignKey
ALTER TABLE "AcademicDocument" DROP CONSTRAINT "AcademicDocument_dosenId_fkey";

-- DropForeignKey
ALTER TABLE "RPS" DROP CONSTRAINT "RPS_dosenId_fkey";

-- CreateIndex
CREATE INDEX "AcademicDocument_dosenId_idx" ON "AcademicDocument"("dosenId");

-- CreateIndex
CREATE INDEX "AcademicDocument_status_idx" ON "AcademicDocument"("status");

-- CreateIndex
CREATE INDEX "AcademicDocument_koordinatorId_idx" ON "AcademicDocument"("koordinatorId");

-- CreateIndex
CREATE INDEX "RPS_dosenId_idx" ON "RPS"("dosenId");

-- CreateIndex
CREATE INDEX "RPS_status_idx" ON "RPS"("status");

-- CreateIndex
CREATE INDEX "RPS_koordinatorId_idx" ON "RPS"("koordinatorId");

-- AddForeignKey
ALTER TABLE "RPS" ADD CONSTRAINT "RPS_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicDocument" ADD CONSTRAINT "AcademicDocument_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
