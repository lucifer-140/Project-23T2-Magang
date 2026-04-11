-- AlterTable
ALTER TABLE "RPS" ADD COLUMN     "kaprodiSigPage" INTEGER,
ADD COLUMN     "kaprodiSigUrl" TEXT,
ADD COLUMN     "kaprodiSigWidth" DOUBLE PRECISION,
ADD COLUMN     "kaprodiSigX" DOUBLE PRECISION,
ADD COLUMN     "kaprodiSigY" DOUBLE PRECISION,
ADD COLUMN     "koordinatorSigPage" INTEGER,
ADD COLUMN     "koordinatorSigUrl" TEXT,
ADD COLUMN     "koordinatorSigWidth" DOUBLE PRECISION,
ADD COLUMN     "koordinatorSigX" DOUBLE PRECISION,
ADD COLUMN     "koordinatorSigY" DOUBLE PRECISION,
ADD COLUMN     "koordinatorSignedPdfUrl" TEXT;
