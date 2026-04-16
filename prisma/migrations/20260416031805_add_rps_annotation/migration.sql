-- CreateTable
CREATE TABLE "RpsAnnotation" (
    "id" TEXT NOT NULL,
    "rpsId" TEXT NOT NULL,
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

    CONSTRAINT "RpsAnnotation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RpsAnnotation" ADD CONSTRAINT "RpsAnnotation_rpsId_fkey" FOREIGN KEY ("rpsId") REFERENCES "RPS"("id") ON DELETE CASCADE ON UPDATE CASCADE;
