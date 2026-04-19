-- Remove LPP_TINDAK_LANJUT and EPP_TINDAK_LANJUT doc types
DELETE FROM "AcademicDocument" WHERE type IN ('LPP_TINDAK_LANJUT', 'EPP_TINDAK_LANJUT');
ALTER TYPE "DocType" RENAME TO "DocType_old";
CREATE TYPE "DocType" AS ENUM ('RPS', 'SOAL_UTS', 'SOAL_UAS', 'LPP', 'EPP', 'BERITA_ACARA');
ALTER TABLE "AcademicDocument" ALTER COLUMN type TYPE "DocType" USING type::text::"DocType";
DROP TYPE "DocType_old";
