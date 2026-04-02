import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/storage/projectStore';
import { loadWorldbuilding } from '@/lib/storage/knowledgeStore';

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

  const worldbuilding = loadWorldbuilding(projectId);

  const apiKey = process.env.DEFAULT_API_KEY || process.env.WRITER_API_KEY;
  const baseUrl = process.env.DEFAULT_BASE_URL || process.env.WRITER_BASE_URL;
  const model = process.env.DEFAULT_MODEL || process.env.WRITER_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json({ error: 'Missing API Key configuration' }, { status: 500 });
  }

  const client = new OpenAI({ apiKey, baseURL: baseUrl });

  const systemPrompt = `你是一位网文角色设计专家。根据用户的小说信息，设计主要角色。

必须严格输出合法的 JSON 对象，不要输出任何多余的文字、markdown 标记或注释。输出格式如下：
{
  "characters": [
    {
      "name": "角色姓名",
      "aliases": "别名或绰号（无则留空字符串）",
      "role": "主角",
      "appearance": "外貌特征（80字内）",
      "personality": "核心性格特质（2-3关键词+简短说明）",
      "speechStyle": "说话习惯、口头禅、语气特点",
      "behaviorRules": "该角色绝对不会做或必然会做的事",
      "growthArc": "角色在故事中的成长变化轨迹",
      "sampleDialogue": "一句最能体现说话风格的台词"
    }
  ]
}
role 字段只能是以下之一：主角、主要配角、反派。`;

  const wb = worldbuilding;
  const userPrompt = `书名：${project.title}
类型：${project.genre}
故事简介：${project.synopsis}
世界背景：${wb.worldBackground || '未设定'}
力量体系：${wb.powerSystem || '未设定'}
主要势力：${wb.factions || '未设定'}

请设计：1个主角 + 2个主要配角 + 1个主要反派，共4个角色。`;

  const stream = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 3000,
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
