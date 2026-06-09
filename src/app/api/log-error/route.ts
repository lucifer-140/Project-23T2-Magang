import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { message, route, stack } = await req.json();
    const userId = await getCurrentUserId();

    await prisma.systemLog.create({
      data: {
        level: 'ERROR',
        route: route ?? req.headers.get('referer') ?? 'client',
        message: String(message).slice(0, 1000),
        userId: userId ?? undefined,
        stack: stack ? String(stack).slice(0, 3000) : undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
