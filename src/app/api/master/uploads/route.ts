import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, getRoles, unauthorized, forbidden } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extCategory(name: string): 'pdf' | 'doc' | 'docx' | 'png' | 'other' {
  const ext = path.extname(name).toLowerCase().slice(1);
  if (ext === 'pdf') return 'pdf';
  if (ext === 'doc') return 'doc';
  if (ext === 'docx') return 'docx';
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return 'png';
  return 'other';
}

type FileEntry = {
  name: string;
  relativePath: string;
  folder: string;
  sizeBytes: number;
  sizeHuman: string;
  modifiedAt: string;
  ext: 'pdf' | 'doc' | 'docx' | 'png' | 'other';
  publicUrl: string;
};

async function scanDir(dir: string, uploadsRoot: string): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  let items: string[];
  try {
    items = await fs.readdir(dir);
  } catch {
    return entries;
  }
  await Promise.all(
    items.map(async (item) => {
      const full = path.join(dir, item);
      const stat = await fs.stat(full).catch(() => null);
      if (!stat) return;
      if (stat.isDirectory()) {
        const sub = await scanDir(full, uploadsRoot);
        entries.push(...sub);
      } else {
        const rel = path.relative(uploadsRoot, full).replace(/\\/g, '/');
        const folder = rel.split('/')[0];
        entries.push({
          name: item,
          relativePath: rel,
          folder,
          sizeBytes: stat.size,
          sizeHuman: humanSize(stat.size),
          modifiedAt: stat.mtime.toISOString(),
          ext: extCategory(item),
          publicUrl: `/uploads/${rel}`,
        });
      }
    })
  );
  return entries;
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  const roles = await getRoles();
  if (!roles.includes('MASTER')) return forbidden();

  const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
  const files = await scanDir(uploadsRoot, uploadsRoot);
  files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));

  const totalSizeBytes = files.reduce((s, f) => s + f.sizeBytes, 0);

  const byFolder: Record<string, { count: number; sizeBytes: number; sizeHuman: string }> = {};
  for (const f of files) {
    if (!byFolder[f.folder]) byFolder[f.folder] = { count: 0, sizeBytes: 0, sizeHuman: '' };
    byFolder[f.folder].count++;
    byFolder[f.folder].sizeBytes += f.sizeBytes;
  }
  for (const k of Object.keys(byFolder)) {
    byFolder[k].sizeHuman = humanSize(byFolder[k].sizeBytes);
  }

  return NextResponse.json({
    files,
    stats: {
      totalFiles: files.length,
      totalSizeBytes,
      totalSizeHuman: humanSize(totalSizeBytes),
      byFolder,
    },
  });
}

export async function DELETE(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return unauthorized();
  const roles = await getRoles();
  if (!roles.includes('MASTER')) return forbidden();

  const { relativePath } = await req.json();
  if (!relativePath || typeof relativePath !== 'string') {
    return NextResponse.json({ error: 'relativePath required' }, { status: 400 });
  }
  // Prevent path traversal
  const safe = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  const absPath = path.join(process.cwd(), 'public', 'uploads', safe);
  try {
    await fs.unlink(absPath);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'File not found or already deleted' }, { status: 404 });
  }
}
