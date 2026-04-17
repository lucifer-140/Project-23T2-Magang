/**
 * Backfill existing RPS records into AcademicDocument (type=RPS).
 * Run once: npx tsx prisma/migrate-rps.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_SEMESTER_ID = null as unknown as string; // Set to an AcademicTerm id if backfilling into a specific term

async function main() {
  const rpsList = await prisma.rPS.findMany({
    include: { matkul: true, dosen: true },
  });

  console.log(`Found ${rpsList.length} RPS records to migrate.`);

  let created = 0;
  let skipped = 0;

  for (const rps of rpsList) {
    try {
      await prisma.academicDocument.upsert({
        where: {
          matkulId_dosenId_semesterId_type: {
            matkulId: rps.matkulId,
            dosenId: rps.dosenId,
            semesterId: DEFAULT_SEMESTER_ID,
            type: 'RPS',
          },
        },
        create: {
          matkulId: rps.matkulId,
          dosenId: rps.dosenId,
          semesterId: DEFAULT_SEMESTER_ID,
          type: 'RPS',
          fileUrl: rps.fileUrl,
          fileName: rps.fileName,
          status: rps.status,
          isKoordinatorApproved: rps.isKoordinatorApproved,
          koordinatorId: rps.koordinatorId,
          koordinatorNotes: rps.koordinatorNotes,
          kaprodiNotes: rps.kaprodiNotes,
          annotatedPdfUrl: rps.annotatedPdfUrl,
          koordinatorSigUrl: rps.koordinatorSigUrl,
          koordinatorSigX: rps.koordinatorSigX,
          koordinatorSigY: rps.koordinatorSigY,
          koordinatorSigPage: rps.koordinatorSigPage,
          koordinatorSigWidth: rps.koordinatorSigWidth,
          koordinatorSignedPdfUrl: rps.koordinatorSignedPdfUrl,
          kaprodiSigUrl: rps.kaprodiSigUrl,
          kaprodiSigX: rps.kaprodiSigX,
          kaprodiSigY: rps.kaprodiSigY,
          kaprodiSigPage: rps.kaprodiSigPage,
          kaprodiSigWidth: rps.kaprodiSigWidth,
          finalPdfUrl: rps.finalPdfUrl,
        },
        update: {},
      });
      created++;
      console.log(`  ✓ ${rps.matkul.code} — ${rps.dosen.name}`);
    } catch (err) {
      skipped++;
      console.warn(`  ✗ ${rps.matkul.code} — ${rps.dosen.name}: ${(err as Error).message}`);
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
