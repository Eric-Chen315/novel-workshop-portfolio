import { NextResponse } from 'next/server';
import { loadWorldbuilding, saveWorldbuilding, WorldbuildingKnowledge } from '@/lib/storage/knowledgeStore';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const data = loadWorldbuilding(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load worldbuilding data' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json() as Partial<WorldbuildingKnowledge>;
    const existing = loadWorldbuilding(id);
    const updated = saveWorldbuilding(id, { ...existing, ...body });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save worldbuilding data' }, { status: 500 });
  }
}
