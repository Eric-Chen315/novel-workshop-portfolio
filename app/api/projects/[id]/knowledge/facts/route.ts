export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { loadFacts, saveFacts, type FactRegistry } from '@/lib/factsManager';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const facts = await loadFacts(id);
  if (!facts) {
    return NextResponse.json({ exists: false });
  }
  return NextResponse.json({ exists: true, ...facts });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as Partial<FactRegistry>;

    const existing = await loadFacts(id);
    const merged: FactRegistry = {
      version: (existing?.version ?? 0) + 1,
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characters: body.characters ?? existing?.characters ?? {},
      techLines: body.techLines ?? existing?.techLines ?? {},
      factions: body.factions ?? existing?.factions ?? {},
      majorEvents: body.majorEvents ?? existing?.majorEvents ?? [],
      revealedInfo: body.revealedInfo ?? existing?.revealedInfo ?? [],
      plotRules: body.plotRules ?? existing?.plotRules ?? [],
      patternKeywords: body.patternKeywords ?? existing?.patternKeywords ?? {},
      bannedExpressions: body.bannedExpressions ?? existing?.bannedExpressions ?? [],
      concepts: body.concepts ?? existing?.concepts ?? {},
      keyData: body.keyData ?? existing?.keyData ?? {},
      timeline: body.timeline ?? existing?.timeline ?? [],
    };

    await saveFacts(id, merged);
    return NextResponse.json(merged);
  } catch (error) {
    console.error('[facts API] 保存 facts.json 失败:', error);
    return NextResponse.json({ error: 'Failed to save facts data' }, { status: 500 });
  }
}
