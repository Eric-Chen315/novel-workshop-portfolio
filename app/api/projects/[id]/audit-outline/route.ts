import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { auditOutlineChapters } from '@/lib/postGenValidator';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  let body: { volumeNumber?: number; chapterNumbers?: number[]; model?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 });
  }

  // chapterNumbers 优先于 volumeNumber
  let targetChapters: Array<{ chapterNumber: number; title: string; rawContent: string }> = [];

  try {
    const outlinePath = path.join(process.cwd(), 'data', 'projects', projectId, 'knowledge', 'outline.json');
    if (!fs.existsSync(outlinePath)) {
      return NextResponse.json({ error: 'outline.json 不存在' }, { status: 404 });
    }

    const outlineData = JSON.parse(fs.readFileSync(outlinePath, 'utf-8'));
    const volumes: Array<{
      volumeNum: number;
      chapters?: Array<{ chapterNum: number; title: string; rawContent?: string; corePurpose?: string; plotPoints?: string[] }>;
    }> = outlineData.volumes || [];

    if (body.chapterNumbers && body.chapterNumbers.length > 0) {
      // 按 chapterNumbers 精确筛选
      const targetSet = new Set(body.chapterNumbers);
      for (const vol of volumes) {
        for (const ch of vol.chapters || []) {
          if (targetSet.has(ch.chapterNum)) {
            targetChapters.push({
              chapterNumber: ch.chapterNum,
              title: ch.title || `第${ch.chapterNum}章`,
              rawContent: ch.rawContent || buildFallbackContent(ch),
            });
          }
        }
      }
    } else if (body.volumeNumber) {
      // 按 volumeNumber 筛选整卷
      const vol = volumes.find(v => v.volumeNum === body.volumeNumber);
      if (!vol) {
        return NextResponse.json({ error: `未找到第${body.volumeNumber}卷` }, { status: 404 });
      }
      for (const ch of vol.chapters || []) {
        targetChapters.push({
          chapterNumber: ch.chapterNum,
          title: ch.title || `第${ch.chapterNum}章`,
          rawContent: ch.rawContent || buildFallbackContent(ch),
        });
      }
    } else {
      return NextResponse.json({ error: '需提供 volumeNumber 或 chapterNumbers' }, { status: 400 });
    }

    if (targetChapters.length === 0) {
      return NextResponse.json({ error: '未找到匹配的章节数据' }, { status: 404 });
    }

    // 调用审计
    const report = await auditOutlineChapters(projectId, targetChapters, {
      model: body.model,
    });

    return NextResponse.json(report);
  } catch (e) {
    console.error('[audit-outline] 审计失败:', e);
    return NextResponse.json(
      { error: `审计失败：${e instanceof Error ? e.message : '未知错误'}` },
      { status: 500 }
    );
  }
}

/** 当 rawContent 不存在时，从结构化字段拼接摘要 */
function buildFallbackContent(ch: {
  corePurpose?: string;
  plotPoints?: string[];
  title?: string;
}): string {
  const parts: string[] = [];
  if (ch.corePurpose) parts.push(`核心：${ch.corePurpose}`);
  if (ch.plotPoints?.length) parts.push(`情节：${ch.plotPoints.join('；')}`);
  return parts.join('\n') || ch.title || '';
}
