import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import path from 'path';
import { writeFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const matkulId = formData.get('matkulId') as string;
  const dosenId = formData.get('dosenId') as string;
  const rpsId = formData.get('rpsId') as string | null;

  if (!file || !matkulId || !dosenId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Save file to public/uploads
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

  const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(uploadDir, safeFileName);
  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const fileUrl = `/uploads/${safeFileName}`;

  let rps;
  if (rpsId) {
    // Update existing RPS — reset approval chain so it goes through Koordinator again
    rps = await prisma.rPS.update({
      where: { id: rpsId },
      data: {
        fileName: file.name,
        fileUrl,
        status: 'SUBMITTED',
        isKoordinatorApproved: false,
        koordinatorNotes: null,
        kaprodiNotes: null,
      },
    });
  } else {
    // Create new RPS
    rps = await prisma.rPS.create({
      data: {
        matkulId,
        dosenId,
        fileName: file.name,
        fileUrl,
        status: 'SUBMITTED',
      },
    });
  }

  return NextResponse.json(rps, { status: 200 });
}
