import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/storage/projectStore';

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
  const coreAbility: string = body.coreAbility || '';

  const apiKey = process.env.DEFAULT_API_KEY || process.env.WRITER_API_KEY;
  const baseUrl = process.env.DEFAULT_BASE_URL || process.env.WRITER_BASE_URL;
  const model = process.env.DEFAULT_MODEL || process.env.WRITER_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json({ error: 'Missing API Key configuration' }, { status: 500 });
  }

  const client = new OpenAI({ apiKey, baseURL: baseUrl });

  const systemPrompt = `你是一位网文世界观设计专家。根据用户提供的小说基本信息，生成一套完整的世界观设定。

必须严格输出合法的 JSON 对象，不要输出任何多余的文字、markdown 标记或注释。输出格式如下：
{
  "background": "世界背景（2-3段，描述整体世界观、时代背景和社会结构）",
  "powerSystem": "力量体系（详细说明修炼/能力体系的规则和等级划分）",
  "factions": [
    { "name": "势力名称", "description": "势力描述（50字内）" }
  ],
  "locations": [
    { "name": "地点名称", "description": "地点描述（30字内）" }
  ],
  "items": [
    { "name": "名称", "description": "描述（30字内）" }
  ]
}
factions、locations、items 各 3-5 条。`;

  const userPrompt = `书名：${project.title}
类型：${project.genre}
故事简介：${project.synopsis}
金手指/核心设定：${coreAbility || '未指定'}
风格：${project.styleDescription}

请根据以上信息生成世界观设定。`;

  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 2000,
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
