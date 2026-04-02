import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { getProject } from '@/lib/storage/projectStore';
import { loadWorldbuilding } from '@/lib/storage/knowledgeStore';
import { getAllCharacters } from '@/lib/storage/characterStore';

export const runtime = 'nodejs';

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  const project = getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const worldbuilding = loadWorldbuilding(projectId);
  const characters = getAllCharacters(projectId);
  const hasMasterOutline = fs.existsSync(getMasterOutlinePath(projectId));

  return NextResponse.json({
    project,
    worldbuilding: {
      worldBackground: worldbuilding.worldBackground,
      powerSystem: worldbuilding.powerSystem,
    },
    characters,
    hasMasterOutline,
  });
}
