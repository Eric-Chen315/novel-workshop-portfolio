import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

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
  const filePath = getMasterOutlinePath(projectId);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ exists: false, volumes: [], totalChapters: 0 });
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return NextResponse.json({ exists: true, ...data });
  } catch {
    return NextResponse.json({ exists: false, volumes: [], totalChapters: 0 });
  }
}
