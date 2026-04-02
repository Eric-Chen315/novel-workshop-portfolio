import { NextResponse } from 'next/server';
import { getAllCharacters, createCharacter } from '@/lib/storage/characterStore';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const characters = getAllCharacters(id);
  return NextResponse.json(characters);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const character = createCharacter(id, body);
  return NextResponse.json(character);
}
