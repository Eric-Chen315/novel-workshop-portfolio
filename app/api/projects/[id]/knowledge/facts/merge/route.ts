import { NextRequest, NextResponse } from 'next/server';
import { mergeFacts } from '@/lib/factsManager';
import type { FactRegistry } from '@/lib/factsManager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = id;
    const body = await request.json();
    const { incoming } = body;

    if (!incoming || typeof incoming !== 'object') {
      return NextResponse.json(
        { error: '缺少 incoming 参数' },
        { status: 400 }
      );
    }

    const mergedFacts = await mergeFacts(projectId, incoming as Partial<FactRegistry>);

    return NextResponse.json(mergedFacts);
  } catch (error) {
    console.error('[API] 事实合并失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '事实合并失败' },
      { status: 500 }
    );
  }
}
