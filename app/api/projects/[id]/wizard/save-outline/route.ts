import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

export const runtime = 'nodejs';

const VolumeSchema = z.object({
  volumeNum: z.number().int().positive(),
  volumeTitle: z.string().default(''),
  chapterRange: z.string().default(''),
  coreConflict: z.string().default(''),
  mainPlot: z.string().default(''),
  systemPhase: z.string().default(''),
  pleasureType: z.string().default(''),
  keyTurningPoints: z.string().default(''),
  emotionalArc: z.string().default(''),
});

const BodySchema = z.object({
  totalChapters: z.number().int().positive(),
  volumes: z.array(VolumeSchema),
});

function getMasterOutlinePath(projectId: string) {
  return path.join(
    process.cwd(),
    'data',
    'projects',
    projectId,
    'knowledge',
    'master-outline.json'
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Bad Request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const outlinePath = getMasterOutlinePath(projectId);
  const dir = path.dirname(outlinePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const data = {
    totalChapters: parsed.data.totalChapters,
    volumes: parsed.data.volumes,
    savedAt: new Date().toISOString(),
  };

  fs.writeFileSync(outlinePath, JSON.stringify(data, null, 2), 'utf-8');

  return NextResponse.json({ success: true });
}
