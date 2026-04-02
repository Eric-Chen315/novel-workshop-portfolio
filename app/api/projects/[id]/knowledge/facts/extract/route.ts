import { NextRequest, NextResponse } from 'next/server';
import { extractFactsFromVolume } from '@/lib/factsExtractor';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;
    const body = await request.json();
    const { volumeNumber } = body;

    if (!volumeNumber || typeof volumeNumber !== 'number') {
      return NextResponse.json(
        { error: '缺少 volumeNumber 参数' },
        { status: 400 }
      );
    }

    const report = await extractFactsFromVolume(projectId, volumeNumber);

    return NextResponse.json(report);
  } catch (error) {
    console.error('[API] 事实提取失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '事实提取失败' },
      { status: 500 }
    );
  }
}
