import { NextResponse } from 'next/server';
import { getCharacter, updateCharacter, deleteCharacter } from '@/lib/storage/characterStore';

export async function GET(request: Request, { params }: { params: Promise<{ id: string; charId: string }> }) {
  const { id, charId } = await params;
  const character = getCharacter(id, charId);
  if (!character) return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  return NextResponse.json(character);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; charId: string }> }) {
  const { id, charId } = await params;
  const body = await request.json();
  const character = updateCharacter(id, charId, body);
  if (!character) return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  return NextResponse.json(character);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; charId: string }> }) {
  const { id, charId } = await params;
  const success = deleteCharacter(id, charId);
  if (!success) return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}