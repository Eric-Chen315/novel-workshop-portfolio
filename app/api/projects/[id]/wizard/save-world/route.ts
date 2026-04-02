import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveWorldSettings } from '@/lib/storage/bibleStore';
import { loadWorldbuilding, saveWorldbuilding } from '@/lib/storage/knowledgeStore';

export const runtime = 'nodejs';

const ItemSchema = z.object({
  name: z.string(),
  description: z.string().default(''),
});

const BodySchema = z.object({
  worldBackground: z.string().default(''),
  powerSystem: z.string().default(''),
  factions: z.array(ItemSchema).default([]),
  locations: z.array(ItemSchema).default([]),
  items: z.array(ItemSchema).default([]),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }

  const { worldBackground, powerSystem, factions, locations, items } = parsed.data;

  // 1. 保存自由文本到 worldbuilding.json（供 knowledgeInjector 使用）
  const existing = loadWorldbuilding(projectId);
  saveWorldbuilding(projectId, {
    ...existing,
    worldBackground,
    powerSystem,
    factions: factions
      .filter((f) => f.name.trim())
      .map((f) => `${f.name}：${f.description}`)
      .join('\n'),
    locations: locations
      .filter((l) => l.name.trim())
      .map((l) => `${l.name}：${l.description}`)
      .join('\n'),
    items: items
      .filter((i) => i.name.trim())
      .map((i) => `${i.name}：${i.description}`)
      .join('\n'),
  });

  // 2. 保存结构化条目到 bible.sqlite world_settings 表
  const worldItems = [
    ...factions.filter((f) => f.name.trim()).map((f) => ({ ...f, category: '势力' })),
    ...locations.filter((l) => l.name.trim()).map((l) => ({ ...l, category: '地点' })),
    ...items.filter((i) => i.name.trim()).map((i) => ({ ...i, category: '道具' })),
  ];
  if (worldItems.length > 0) {
    saveWorldSettings(projectId, worldItems);
  }

  return NextResponse.json({ success: true });
}
