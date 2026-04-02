import { NextResponse } from 'next/server';
import { loadOutline, saveOutline, OutlineKnowledge } from '@/lib/storage/knowledgeStore';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = loadOutline(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load outline data' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json() as OutlineKnowledge;
    const updated = saveOutline(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save outline data' }, { status: 500 });
  }
}
