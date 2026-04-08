import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Delete RPS related to this matkul first
    await prisma.rPS.deleteMany({ where: { matkulId: id } });
    
    // Delete change requests related to this matkul
    await prisma.matkulChangeRequest.deleteMany({ where: { matkulId: id } });

    // Delete the Matkul itself (disconnects dosens and koordinators automatically)
    await prisma.matkul.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete matkul.' }, { status: 500 });
  }
}
