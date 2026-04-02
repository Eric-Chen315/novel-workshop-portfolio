import { NextResponse } from 'next/server';
import { loadOutline } from '@/lib/storage/knowledgeStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; chapterNum: string }> }
) {
  const { id, chapterNum } = await params;
  
  try {
    const chapterNumInt = parseInt(chapterNum, 10);
    
    if (isNaN(chapterNumInt)) {
      return NextResponse.json(
        { error: 'Invalid chapter number' },
        { status: 400 }
      );
    }
    
    const outline = loadOutline(id);
    
    // Search through all volumes to find the chapter
    let foundChapter = null;
    
    for (const volume of outline.volumes) {
      const chapter = volume.chapters.find(ch => ch.chapterNum === chapterNumInt);
      if (chapter) {
        foundChapter = chapter;
        break;
      }
    }
    
    if (!foundChapter) {
      return NextResponse.json({
        chapterNum: chapterNumInt,
        title: null,
        exists: false,
      });
    }
    
    return NextResponse.json({
      chapterNum: chapterNumInt,
      title: foundChapter.title,
      summary: foundChapter.summary || '',
      status: foundChapter.status,
      rawContent: foundChapter.rawContent || '',
      corePurpose: foundChapter.corePurpose || '',
      plotPoints: foundChapter.plotPoints || [],
      keyCharacters: foundChapter.keyCharacters || [],
      emotionalArc: foundChapter.emotionalArc || '',
      mustInclude: foundChapter.mustInclude || [],
      connectionToPrev: foundChapter.connectionToPrev || '',
      connectionToNext: foundChapter.connectionToNext || '',
      suggestedWordCount: foundChapter.suggestedWordCount,
      wordCountGuide: foundChapter.wordCountGuide || '',
      exists: true,
    });
  } catch (error) {
    console.error('Error fetching outline chapter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch outline chapter' },
      { status: 500 }
    );
  }
}
