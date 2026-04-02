import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { get, save } from '@/lib/storage/chapterStore';
import { loadOutline } from '@/lib/storage/knowledgeStore';
import { getModelConfig } from '@/lib/ai/modelRouter';

export const runtime = 'nodejs';

/**
 * POST /api/projects/[id]/chapters/[num]/preview
 * 
 * 根据下一章细纲重新生成"下集预告"，替换当前章节终稿中的预告部分
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; num: string }> }
) {
  const { id, num } = await params;
  const chapterNum = parseInt(num, 10);

  if (isNaN(chapterNum)) {
    return NextResponse.json({ error: '无效的章节号' }, { status: 400 });
  }

  try {
    console.log(`\n========== 开始处理第${chapterNum}章预告更新 ==========`);
    
    // 1. 读取当前章节
    const currentChapter = await get(id, chapterNum);
    console.log('1. 当前章节读取结果:', currentChapter ? '成功' : '失败');
    if (!currentChapter) {
      return NextResponse.json({ error: '当前章节不存在' }, { status: 404 });
    }

    if (!currentChapter.content) {
      return NextResponse.json({ error: '当前章节内容为空' }, { status: 400 });
    }
    console.log('   当前章节内容长度:', currentChapter.content.length);

    // 2. 读取下一章细纲
    console.log(`2. 尝试读取第${chapterNum + 1}章细纲...`);
    const outline = loadOutline(id);
    console.log('   大纲加载结果:', outline ? '成功' : '失败');
    console.log('   大纲卷数:', outline?.volumes?.length || 0);
    
    let nextChapter = null;

    for (const volume of outline.volumes) {
      const found = volume.chapters.find(ch => ch.chapterNum === chapterNum + 1);
      if (found) {
        nextChapter = found;
        break;
      }
    }

    console.log('   下一章细纲查找结果:', nextChapter ? '找到' : '未找到');
    if (nextChapter) {
      console.log('   下一章标题:', nextChapter.title);
      console.log('   下一章概要:', nextChapter.summary?.substring(0, 100) || '无');
      console.log('   下一章核心内容长度:', (nextChapter.rawContent || nextChapter.plotSummary || '').length);
      console.log('   下一章章末钩子:', nextChapter.endHook || '无');
    }

    if (!nextChapter) {
      return NextResponse.json({ 
        message: '无下一章细纲，跳过预告生成',
        skipped: true 
      });
    }

    // 3. 构建生成预告的 prompt
    const mustIncludeText = nextChapter.mustInclude && nextChapter.mustInclude.length > 0
      ? nextChapter.mustInclude.join('、')
      : '无';

    const prompt = `请根据下一章的细纲内容，生成"下集预告"板块，包含预告和互动引导。

下一章细纲：
标题：${nextChapter.title || '未命名'}
概要：${nextChapter.summary || '无'}
核心内容：${nextChapter.rawContent || nextChapter.plotSummary || '无'}
章末钩子：${nextChapter.endHook || '无'}
必须包含：${mustIncludeText}

【严格约束】
1. 预告总长度不超过50字，最多2句话。只写最核心的一个悬念点，不要铺开多条线
2. 预告中的每一个画面、动作、台词，都必须能在上述细纲中找到明确对应
3. 禁止编造细纲中没有的台词（不要给角色写细纲里不存在的话）
4. 禁止编造细纲中没有的情节（如果细纲没提某个具体行为，就不能写该行为）
5. 优先使用细纲中【章末钩子】的内容作为预告核心，可以适当改写使其更有悬念感，但不能改变含义
6. 如果细纲信息不足以写出有吸引力的预告，宁可用模糊悬念句（如"一个意想不到的信号出现了"），也不要编造具体细节
7. 不要出现章节号或章节名
8. 不要用括号包裹内容

输出格式（严格遵守）：
【下集预告】
（预告内容，1-2句话）

求五星好评、求追读，稳定日更不断更。`;

    console.log('\n3. 完整Prompt:');
    console.log('---START PROMPT---');
    console.log(prompt);
    console.log('---END PROMPT---\n');

    // 4. 调用 AI 生成预告
    console.log('4. 准备调用AI模型...');
    const { model, apiKey, baseUrl } = getModelConfig('终稿');
    console.log('   模型配置:', { model, baseUrl, hasApiKey: !!apiKey });

    if (!apiKey) {
      console.error('   错误: 缺少API Key');
      return NextResponse.json(
        { error: '缺少 API Key 配置' },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl || 'https://api.kuai.host/v1',
    });

    console.log('   开始调用模型API...');
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: '你是一位专业的网文编辑，擅长根据细纲内容撰写吸引读者的章末预告。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 2048,
      // @ts-ignore - Gemini特有参数
      thinking_budget: 512,
    } as any);

    console.log('   模型调用成功');
    console.log('   原始响应:', JSON.stringify(completion, null, 2));

    let generatedPreview = completion.choices[0]?.message?.content?.trim() || '';
    console.log('\n5. 生成的预告内容（原始）:');
    console.log('---START PREVIEW---');
    console.log(generatedPreview);
    console.log('---END PREVIEW---\n');

    if (!generatedPreview) {
      console.error('   错误: 生成的预告为空');
      return NextResponse.json({ error: '生成预告失败' }, { status: 500 });
    }

    // 清洗预告内容：去掉模型开场白，只保留【下集预告】及之后的内容
    generatedPreview = cleanPreviewContent(generatedPreview);
    console.log('   清洗后的预告内容:');
    console.log('---START CLEANED PREVIEW---');
    console.log(generatedPreview);
    console.log('---END CLEANED PREVIEW---\n');

    // 5. 替换章节内容中的预告部分
    console.log('6. 开始替换预告部分...');
    console.log('   原内容末尾200字符:', currentChapter.content.slice(-200));
    
    const updatedContent = replacePreviewSection(
      currentChapter.content,
      generatedPreview
    );
    
    console.log('   替换后内容末尾200字符:', updatedContent.slice(-200));
    console.log('   内容长度变化:', currentChapter.content.length, '->', updatedContent.length);

    // 6. 保存更新后的章节
    console.log('7. 保存更新后的章节...');
    currentChapter.content = updatedContent;
    currentChapter.updatedAt = new Date().toISOString();
    await save(id, currentChapter);
    console.log('   保存成功');

    return NextResponse.json({
      success: true,
      message: `第${chapterNum}章的下集预告已更新`,
      preview: generatedPreview,
      chapterNum: chapterNum,
    });

  } catch (error) {
    console.error('\n========== 错误详情 ==========');
    console.error('错误类型:', error?.constructor?.name);
    console.error('错误消息:', error instanceof Error ? error.message : String(error));
    console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
    console.error('完整错误对象:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('========== 错误详情结束 ==========\n');
    
    return NextResponse.json(
      { 
        error: '生成预告时发生错误', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * 清洗预告内容：去掉模型的开场白，只保留【下集预告】及之后的内容
 */
function cleanPreviewContent(rawContent: string): string {
  // 优先查找【下集预告】标记
  const bracketIndex = rawContent.indexOf('【下集预告】');
  if (bracketIndex !== -1) {
    return rawContent.substring(bracketIndex).trim();
  }

  // 其次查找"下集预告"（不带括号）
  const plainIndex = rawContent.indexOf('下集预告');
  if (plainIndex !== -1) {
    return rawContent.substring(plainIndex).trim();
  }

  // 如果都没找到，尝试去掉开头的分割线和开场白
  let cleaned = rawContent.trim();
  
  // 去掉开头的分割线
  cleaned = cleaned.replace(/^---+\s*/g, '');
  
  // 去掉常见的开场白模式（如"好的"、"明白"、"交给我"等）
  const openingPatterns = [
    /^好的[，。！,!]\s*/,
    /^明白[了]?[，。！,!]\s*/,
    /^收到[，。！,!]\s*/,
    /^交给我[，。！,!]\s*/,
    /^身为.*?[，。！,!]\s*/,
    /^作为.*?[，。！,!]\s*/,
  ];
  
  for (const pattern of openingPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  return cleaned.trim();
}

/**
 * 替换正文中的预告部分
 * 从文本中找到最早出现的脏数据标记，从该位置到末尾全部替换
 */
function replacePreviewSection(originalText: string, newPreview: string): string {
  // 定义所有可能的脏数据标记（按优先级排序）
  const dirtyMarkers = [
    '【下集预告】',
    '下集预告',
    '好的，交给我',
    '好的,交给我',
    '好的。交给我',
    '身为专业编辑',
    '作为专业编辑',
    '明白。',
    '收到。',
  ];

  // 查找所有标记的位置，取最早出现的
  let earliestIndex = -1;
  let foundMarker = '';

  for (const marker of dirtyMarkers) {
    const index = originalText.indexOf(marker);
    if (index !== -1 && (earliestIndex === -1 || index < earliestIndex)) {
      earliestIndex = index;
      foundMarker = marker;
    }
  }

  // 查找独立的分割线（前后有换行）
  const separatorPattern = /\n---+\n/;
  const separatorMatch = originalText.match(separatorPattern);
  if (separatorMatch && separatorMatch.index !== undefined) {
    if (earliestIndex === -1 || separatorMatch.index < earliestIndex) {
      earliestIndex = separatorMatch.index;
      foundMarker = '分割线';
    }
  }

  // 如果找到了脏数据标记，从该位置截断
  if (earliestIndex !== -1) {
    console.log(`   找到脏数据标记"${foundMarker}"，位置: ${earliestIndex}`);
    const cleanText = originalText.substring(0, earliestIndex).trimEnd();
    return cleanText + '\n\n' + newPreview;
  }

  // 如果没有找到任何标记，追加到末尾
  console.log('   未找到脏数据标记，追加到末尾');
  return originalText.trimEnd() + '\n\n' + newPreview;
}
