import { NextResponse } from 'next/server';
import { getAll, save } from '@/lib/storage/chapterStore';

interface ChapterInput {
  chapterNum: number;
  title: string;
  content: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chapters = await getAll(id);
  return NextResponse.json(chapters);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const input: ChapterInput = await request.json();
  
  const { chapterNum, title, content } = input;
  
  // 计算字数（中文字数）
  const wordCount = content.replace(/\s/g, '').length;
  
  // 获取当前时间
  const now = new Date().toISOString();
  
  // 构建章节对象（兼容 num 和 chapterNum）
  const chapter = {
    num: chapterNum,
    chapterNum: chapterNum,
    title,
    content,
    wordCount,
    status: '已完成' as const,
    createdAt: now,
    updatedAt: now,
  };
  
  await save(id, chapter);
  return NextResponse.json({ success: true, chapterNum });
}
