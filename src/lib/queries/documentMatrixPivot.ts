import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import type { MatrixRow } from '@/lib/api-types';

// Returns one row per (MatkulClass × Dosen) for the given semester.
// RPS records with matkulClassId IS NULL are excluded by the JOIN.
// AcademicDocuments with matkulClassId IS NULL are excluded by the JOIN.
export async function runDocumentMatrixPivot(semesterId: string): Promise<MatrixRow[]> {
  const rows = await prisma.$queryRaw<MatrixRow[]>(Prisma.sql`
    SELECT
      mc.id            AS "matkulClassId",
      mc.name          AS "kelasName",
      mk.id            AS "matkulId",
      mk.code          AS "matkulCode",
      mk.name          AS "matkulName",
      u.id             AS "dosenId",
      u.name           AS "dosenName",

      MAX(CASE WHEN ad.type = 'RPS'      THEN ad."fileName" END) AS "rpsFileName",
      MAX(CASE WHEN ad.type = 'RPS'      THEN ad."fileUrl"  END) AS "rpsFileUrl",
      MAX(CASE WHEN ad.type = 'LPP'      THEN ad."fileName" END) AS "lppFileName",
      MAX(CASE WHEN ad.type = 'LPP'      THEN ad."fileUrl"  END) AS "lppFileUrl",
      MAX(CASE WHEN ad.type = 'SOAL_UTS' THEN ad."fileName" END) AS "utsFileName",
      MAX(CASE WHEN ad.type = 'SOAL_UTS' THEN ad."fileUrl"  END) AS "utsFileUrl",
      MAX(CASE WHEN ad.type = 'EPP_UTS'  THEN ad."fileName" END) AS "eppUtsFileName",
      MAX(CASE WHEN ad.type = 'EPP_UTS'  THEN ad."fileUrl"  END) AS "eppUtsFileUrl",
      MAX(CASE WHEN ad.type = 'SOAL_UAS' THEN ad."fileName" END) AS "uasFileName",
      MAX(CASE WHEN ad.type = 'SOAL_UAS' THEN ad."fileUrl"  END) AS "uasFileUrl",
      MAX(CASE WHEN ad.type = 'EPP_UAS'  THEN ad."fileName" END) AS "eppUasFileName",
      MAX(CASE WHEN ad.type = 'EPP_UAS'  THEN ad."fileUrl"  END) AS "eppUasFileUrl"

    FROM "MatkulClass" mc
    JOIN "Matkul" mk ON mk.id = mc."matkulId"
    JOIN "_ClassDosen" cd ON cd."A" = mc.id
    JOIN "User" u ON u.id = cd."B"
    LEFT JOIN "AcademicDocument" ad
      ON ad."matkulClassId" = mc.id
      AND ad."dosenId" = u.id
      AND ad."semesterId" = ${semesterId}
      AND ad."fileUrl" IS NOT NULL
      AND ad.type IN ('RPS', 'LPP', 'SOAL_UTS', 'EPP_UTS', 'SOAL_UAS', 'EPP_UAS')
    WHERE mk."semesterId" = ${semesterId}
    GROUP BY mc.id, mc.name, mk.id, mk.code, mk.name, u.id, u.name
    ORDER BY mk.code, mc.name, u.name
  `);
  return rows;
}
