import { NextRequest } from 'next/server';
import { getCurrentUserId, getRoles, unauthorized, forbidden } from '@/lib/auth';
import { runDocumentMatrixPivot } from '@/lib/queries/documentMatrixPivot';
import { prisma } from '@/lib/db';
import ExcelJS, { type Cell } from 'exceljs';
import type { MatrixRow } from '@/lib/api-types';

const HEADERS = ['Kelas', 'Kode MK', 'Nama MK', 'Dosen', 'RPS', 'LPP', 'Soal UTS', 'EPP UTS', 'Soal UAS', 'EPP UAS'];
const COL_WIDTHS = [14, 12, 36, 24, 32, 32, 32, 32, 32, 32];

const DOC_FIELDS: Array<[keyof MatrixRow, keyof MatrixRow]> = [
  ['rpsFileName',    'rpsFileUrl'],
  ['lppFileName',    'lppFileUrl'],
  ['utsFileName',    'utsFileUrl'],
  ['eppUtsFileName', 'eppUtsFileUrl'],
  ['uasFileName',    'uasFileUrl'],
  ['eppUasFileName', 'eppUasFileUrl'],
];

function toAbsolute(fileUrl: string, origin: string) {
  return fileUrl.startsWith('http') ? fileUrl : `${origin}${fileUrl}`;
}

function fillSheet(ws: ExcelJS.Worksheet, rows: MatrixRow[], origin: string, sheetTitle?: string) {
  if (sheetTitle) {
    const titleRow = ws.addRow([sheetTitle]);
    titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF1A2A4A' } };
    ws.addRow([]); // blank spacer
  }

  const headerRow = ws.addRow(HEADERS);
  headerRow.eachCell((cell: Cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A2A4A' } };
  });

  for (const row of rows) {
    const excelRow = ws.addRow([
      row.kelasName, row.matkulCode, row.matkulName, row.dosenName,
      null, null, null, null, null, null,
    ]);
    DOC_FIELDS.forEach(([nameKey, urlKey], i) => {
      const cell = excelRow.getCell(5 + i);
      const fileName = row[nameKey] as string | null;
      const fileUrl  = row[urlKey]  as string | null;
      if (fileName && fileUrl) {
        cell.value = { text: fileName, hyperlink: toAbsolute(fileUrl, origin) };
        cell.font  = { color: { argb: 'FF1A2A4A' }, underline: true };
      } else {
        cell.value = '—';
        cell.font  = { color: { argb: 'FF9CA3AF' } };
      }
    });
  }

  ws.columns = COL_WIDTHS.map(w => ({ width: w }));
}

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();

  const roles = await getRoles();
  if (!roles.includes('MASTER') && !roles.includes('KAPRODI')) return forbidden();

  const origin = req.nextUrl.origin;
  const all    = req.nextUrl.searchParams.get('all') === 'true';
  const semesterId = req.nextUrl.searchParams.get('semesterId');

  if (!all && !semesterId) return new Response('semesterId required', { status: 400 });

  const wb = new ExcelJS.Workbook();

  if (all) {
    // One sheet per semester, ordered by tahun desc then nama desc
    const semesters = await prisma.semester.findMany({
      include: { tahunAkademik: true },
      orderBy: [{ tahunAkademik: { tahun: 'desc' } }, { nama: 'desc' }],
    });

    for (const sem of semesters) {
      const rows = await runDocumentMatrixPivot(sem.id);
      const sheetName = `${sem.tahunAkademik.tahun.replace(/\//g, '-')} ${sem.nama}`.slice(0, 31);
      const ws = wb.addWorksheet(sheetName);
      fillSheet(ws, rows, origin, `TA ${sem.tahunAkademik.tahun} - Semester ${sem.nama}`);
    }

    const buffer = await wb.xlsx.writeBuffer();
    return new Response(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="matrix-dokumen-semua-semester.xlsx"',
      },
    });
  }

  // Single semester
  const rows = await runDocumentMatrixPivot(semesterId!);
  const ws = wb.addWorksheet('Matrix Dokumen');
  fillSheet(ws, rows, origin);

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="matrix-dokumen-${semesterId}.xlsx"`,
    },
  });
}
