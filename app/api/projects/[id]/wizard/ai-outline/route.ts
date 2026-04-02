import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/storage/projectStore';
import { loadWorldbuilding } from '@/lib/storage/knowledgeStore';
import { getAllCharacters } from '@/lib/storage/characterStore';

export const runtime = 'nodejs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const project = getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const totalChapters: number = Number(body.totalChapters) || 200;
  const volumeCount: number = Number(body.volumeCount) || Math.max(2, Math.round(totalChapters / 50));
  const coreAbility: string = body.coreAbility || '';

  const apiKey = process.env.DEFAULT_API_KEY || process.env.WRITER_API_KEY;
  const baseUrl = process.env.DEFAULT_BASE_URL || process.env.WRITER_BASE_URL;
  const model = process.env.OUTLINE_MODEL || process.env.DEFAULT_MODEL || process.env.WRITER_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json({ error: 'Missing API Key configuration' }, { status: 500 });
  }

  // 加载世界观和角色数据
  const wb = loadWorldbuilding(projectId);
  const chars = getAllCharacters(projectId);
  const mainChars = chars.filter((c) => c.role !== '路人');

  const charLines = mainChars.length > 0
    ? mainChars
        .map((c) => `- ${c.name}（${c.role}）：${c.personality || '性格待定'}`)
        .join('\n')
    : '- 暂无角色设定';

  const client = new OpenAI({ apiKey, baseURL: baseUrl });

  const systemPrompt = `你是一位顶级网文策划大师，擅长设计节奏紧凑、爽点密集、钩子连贯的全书大纲。

必须严格输出合法的 JSON 对象，不要输出任何多余的文字、markdown 标记或注释。输出格式如下：
{
  "volumes": [
    {
      "volumeNum": 1,
      "volumeTitle": "卷名（4-8字，概括本卷核心主题）",
      "chapterRange": "1-50",
      "coreConflict": "本卷核心矛盾冲突（50字内）",
      "mainPlot": "主线剧情推进（150字内，描述主要事件走向和节奏）",
      "systemPhase": "主角金手指/能力在本卷的成长阶段与关键突破点",
      "pleasureType": "本卷核心爽点类型（如：逆袭打脸、升级突破、装逼打脸、救美护友等）",
      "keyTurningPoints": "2-3个关键转折点，用分号隔开",
      "emotionalArc": "主角情感状态变化（从XXX到XXX）"
    }
  ]
}
要求：
1. 共生成 ${volumeCount} 卷，总章节 ${totalChapters} 章，各卷章节数量合理分配
2. 整体遵循"新手村→崛起→高潮→决战"的节奏
3. 各卷末尾设置悬念钩子，吸引读者追更
4. 主角成长弧线完整，金手指逐步解锁有层次感
5. 反派和配角在各卷中的作用需有所提及`;

  const userPrompt = `书名：${project.title}
类型：${project.genre}
故事简介：${project.synopsis}
文风：${project.styleDescription}
${coreAbility ? `金手指/核心设定：${coreAbility}` : ''}
世界背景：${wb.worldBackground || '未设定'}
力量体系：${wb.powerSystem || '未设定'}
主要角色：
${charLines}

请生成 ${volumeCount} 卷、共 ${totalChapters} 章的全书分卷大纲。`;

  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 16000,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) controller.enqueue(encoder.encode(content));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
