import path from 'path';
import { mkdirSync } from 'fs';
import { unlink } from 'fs/promises';

const DOC_TYPE_FOLDER: Record<string, string> = {
  RPS: 'rps',
  SOAL_UTS: 'soal-uts',
  SOAL_UAS: 'soal-uas',
  LPP: 'lpp',
  EPP: 'epp',
  BERITA_ACARA: 'berita-acara',
};

export function docTypeToFolder(type: string): string {
  return DOC_TYPE_FOLDER[type] ?? type.toLowerCase().replace(/_/g, '-');
}

export function getUploadDir(typeFolder: string, sub: string): string {
  const dir = path.join(process.cwd(), 'public', 'uploads', typeFolder, sub);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function sanitizeName(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function unlinkIfExists(publicRelativeUrl: string | null | undefined): Promise<void> {
  if (!publicRelativeUrl) return;
  try {
    await unlink(path.join(process.cwd(), 'public', publicRelativeUrl));
  } catch {
    // file doesn't exist or already deleted — ignore
  }
}
