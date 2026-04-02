import { NextResponse } from 'next/server';
import { Chapter } from '@/lib/types/chapter';
import { get, save, deleteChapter } from '@/lib/storage/chapterStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; num: string }> }
) {
  const { id, num } = await params;
  const chapter = await get(id, parseInt(num));
  if (!chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
  }
  return NextResponse.json(chapter);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; num: string }> }
) {
  const { id } = await params;
  const chapter: Chapter = await request.json();
  await save(id, chapter);
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; num: string }> }
) {
  const { id, num } = await params;
  const chapterNum = parseInt(num, 10);
  if (isNaN(chapterNum)) {
    return NextResponse.json({ error: 'Invalid chapter number' }, { status: 400 });
  }
  await deleteChapter(id, chapterNum);
  return NextResponse.json({ success: true });
}
