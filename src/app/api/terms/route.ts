import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Deprecated — use /api/tahun-akademik instead
export async function GET() {
  return NextResponse.json([]);
}

export async function POST() {
  return NextResponse.json({ error: 'Use /api/tahun-akademik' }, { status: 410 });
}
