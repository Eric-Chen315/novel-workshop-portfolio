import OpenAI from "openai";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getModelConfig } from "@/lib/ai/modelRouter";

import { ensureChapterEndingTextStream, stringToStream, encodeTextStream } from "@/lib/chapterEnding";
import { READER_SIMULATOR_SYSTEM_PROMPT } from "@/lib/prompts/reader-simulator";
import { QA_EDITOR_SYSTEM_PROMPT } from "@/lib/prompts/qa-editor";
import { getBibleCoreSummary } from "@/lib/bible/bibleService";
import { getAllCharacters } from "@/lib/storage/characterStore";
import { buildKnowledgeContext, assembleStoryGuardContext, type InjectedPrompt } from "@/lib/knowledgeInjector";
import { getVolumeByChapter } from "@/lib/factsManager";
import {
  preprocessCreativeInstructions,
  detectAndInjectAntagonistTemplate,
} from "@/lib/preprocess";
import {
  trimTailBoilerplate,
  checkAnchors,
  checkUnauthorizedCharacters,
  checkWordCount,
  checkPatternRepetition,
  runFullConstraintCheck,
  checkForbiddenRules,
  type AnchorItem,
  type HardConstraintReport,
  type ConstraintLogEntry,
} from "@/lib/hardConstraints";
import { extractChapterState, saveChapterState } from "@/lib/chapterStateManager";
import { getPronounRule } from "@/lib/genderRules";

export const runtime = "nodejs";

const AnchorItemSchema = z.object({
  text: z.string(),
  speaker: z.string().default(""),
  position: z.string().default(""),
});

const ANTAGONIST_SCENE_DIVERSITY_RULE = `【场景描写禁令】
以下场景组合已在近期章节中过度使用，本章严禁出现：
- 反派站在落地窗前俯瞰城市天际线
- 反派端着酒杯（威士忌/波本/红酒/清水）发表冷漠独白
- "纽约/曼哈顿/华尔街"作为反派场景的开头定位词
- "钢铁丛林""冷漠地俯瞰"等固定搭配

反派出场时必须使用差异化场景，例如：会议室内的数据投影、通勤路上的电话指令、健身房里的决策、深夜厨房独处、机场贵宾厅等日常化场景。反派的危险感应通过行为和决策体现，而非通过"高处俯瞰+酒杯"的视觉符号。`;

const BodySchema = z.object({
  step: z.coerce.number().int().min(1).max(5).default(1),
  direction: z.string().optional().default(""),
  outlineContent: z.string().optional().default(""),
  extra: z.string().optional().default(""),
  tab1: z.string().optional().default(""),
  tab2: z.string().optional().default(""),
  tab3: z.string().optional().default(""),
  tab4: z.string().optional().default(""),
  background: z.string().optional().default(""),
  chapterNo: z.string().optional().default(""),
  last3ShuangTypes: z.string().optional().default(""),
  /** 锚定文本列表（前端以 JSON 字符串传入） */
  anchorsJson: z.string().optional().default(""),
  /** 禁止规则列表（每行一条） */
  forbiddenRules: z.string().optional().default(""),
  /** 项目ID */
  projectId: z.string().optional().default(""),
});

// 辅助函数：将 OpenAI stream 转为 Web ReadableStream
function openaiStreamToReadable(stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

function estimatePromptTokens(text: string) {
  return Math.ceil(text.length * 1.5);
}

function truncateForLog(text: string, maxLength = 800) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}\n...<截断，原始长度 ${text.length} 字符>`;
}

function createStep4DiagnosticStream(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
  meta: {
    model: string;
    temperature: number;
    maxTokens: number;
    effectiveMaxTokens: number;
    promptChars: number;
    estimatedPromptTokens: number;
    systemChars: number;
    userPromptChars: number;
  }
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const startedAt = Date.now();
      let chunkCount = 0;
      let contentChunkCount = 0;
      let rawText = "";
      let firstContentSample = "";
      let lastContentSample = "";

      console.log("=== Step 4 审核报告诊断：请求摘要 ===");
      console.log({
        model: meta.model,
        temperature: meta.temperature,
        configuredMaxTokens: meta.maxTokens,
        effectiveMaxTokens: meta.effectiveMaxTokens,
        promptChars: meta.promptChars,
        estimatedPromptTokens: meta.estimatedPromptTokens,
        systemChars: meta.systemChars,
        userPromptChars: meta.userPromptChars,
      });

      try {
        for await (const chunk of stream) {
          chunkCount += 1;
          const content = chunk.choices[0]?.delta?.content;

          if (content) {
            contentChunkCount += 1;
            rawText += content;
            if (!firstContentSample) {
              firstContentSample = content;
            }
            lastContentSample = content;
            controller.enqueue(encoder.encode(content));
          }
        }

        const durationMs = Date.now() - startedAt;
        console.log("=== Step 4 审核报告诊断：流式返回摘要 ===");
        console.log({
          durationMs,
          chunkCount,
          contentChunkCount,
          outputChars: rawText.length,
          isEmptyOutput: rawText.length === 0,
          firstContentSample: truncateForLog(firstContentSample, 200),
          lastContentSample: truncateForLog(lastContentSample, 200),
        });
        console.log("=== Step 4 审核报告诊断：AI 原始返回（截断）===");
        console.log(truncateForLog(rawText, 4000));

        controller.close();
      } catch (error) {
        const durationMs = Date.now() - startedAt;
        console.error("=== Step 4 审核报告诊断：流式调用异常 ===");
        console.error({
          durationMs,
          chunkCount,
          contentChunkCount,
          outputChars: rawText.length,
          error,
        });
        console.error("=== Step 4 审核报告诊断：异常前 AI 原始返回（截断）===");
        console.error(truncateForLog(rawText, 4000));
        controller.error(error);
      }
    },
  });
}

export async function POST(req: Request) {

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Bad Request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    step,
    direction,
    outlineContent,
    extra,
    tab1,
    tab2,
    tab3,
    tab4,
    background,
    chapterNo,
    last3ShuangTypes,
    anchorsJson,
    forbiddenRules,
    projectId,
  } = parsed.data;

  const { model, apiKey, baseUrl } = getModelConfig(
    step === 1 ? "初稿" :
    step === 2 ? "读者反馈" :
    step === 3 ? "二稿" :
    step === 4 ? "审核报告" : "终稿"
  );

  if (!apiKey) {
    return Response.json(
      {
        error: "Missing API Key",
        hint: "请在 .env.local 中配置对应的 API Key（参考 .env.local.example）后重启 dev server。",
      },
      { status: 500 }
    );
  }

  // 创建 OpenAI 客户端
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl || 'https://api.kuai.host/v1',
  });

  // 解析锚定文本
  let anchors: AnchorItem[] = [];
  if (anchorsJson) {
    try {
      const raw = JSON.parse(anchorsJson);
      if (Array.isArray(raw)) {
        anchors = raw
          .map((item) => AnchorItemSchema.safeParse(item))
          .filter((r) => r.success)
          .map((r) => (r as { success: true; data: AnchorItem }).data);
      }
    } catch {
      // 忽略解析失败
    }
  }

  // 解析禁止规则（每行一条，过滤空行）
  const forbiddenList = forbiddenRules
    ? forbiddenRules
        .split("\n")
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
    : [];

  // 动态读取角色圣经（优先从项目级数据库读取）
  const bibleSummary = await getBibleCoreSummary(projectId || undefined);

  // 动态获取主角姓名（用于写作风格约束，避免硬编码）
  let protagonistName = "主角";
  if (projectId) {
    try {
      const chars = getAllCharacters(projectId);
      const protagonist = chars.find((c) => c.role === "主角");
      if (protagonist?.name) protagonistName = protagonist.name;
    } catch {
      // 读取失败时保持默认值
    }
  }

  // LLM 调用工具函数（用于预处理/约束检查阶段的小型辅助调用）
  async function helperLlmCall(prompt: string): Promise<string> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'user', content: prompt },
    ];
    const stream = await client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.3,
      stream: true,
    });
    let text = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        text += content;
      }
    }
    return text;
  }

  async function callModelWithConfig(prompt: string, configName: "初稿" | "读者反馈" | "二稿" | "审核报告" | "终稿"): Promise<string> {
    const config = getModelConfig(configName);
    const configTemperatureMap: Record<"初稿" | "读者反馈" | "二稿" | "审核报告" | "终稿", number> = {
      "初稿": 0.8,
      "读者反馈": 0.3,
      "二稿": 0.8,
      "审核报告": 0.3,
      "终稿": 0.7,
    };
    const configMaxTokensMap: Record<"初稿" | "读者反馈" | "二稿" | "审核报告" | "终稿", number> = {
      "初稿": 8000,
      "读者反馈": 2000,
      "二稿": 8000,
      "审核报告": 3000,
      "终稿": 8000,
    };
    const modelClient = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || 'https://api.kuai.host/v1',
    });

    const completion = await modelClient.chat.completions.create({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: configTemperatureMap[configName],
      max_tokens: configMaxTokensMap[configName],
      stream: false,
    });

    return completion.choices[0]?.message?.content || '';
  }

  const WRITER_SYSTEM_PROMPT = `你是一位网文职业写手。你的任务是根据用户给定的"章节方向"，写出可直接发布的小说章节正文。

写作要求：
- 中文输出
- 叙事清晰、节奏快、对话自然
- 每200~400字给出一个推进点（信息/冲突/反转/爽点/悬念）
- 只输出正文，不要输出提纲或解释


${bibleSummary}

【章节结构铁律（违反任何一条则本章作废）】

1. 开头300字必须直接承接上一章结尾的场景、情绪或悬念，不得凭空开启全新场景。如果上下文中提供了"上一章结尾摘录"或"上一章下集预告"，开头必须与之呼应。
2. 细纲中的endHook内容必须出现在正文最后500字以内（章末板块之前）。endHook是本章的最后一个叙事动作，绝对不得提前到章节中段或开头使用。章末板块之前的最后一段文字，必须是endHook描述的场景或台词。
3. 细纲中的plotPoints必须按给定顺序展开，不得颠倒先后顺序。第一条plotPoint对应章节前段，最后一条plotPoint对应章节后段。
4. 角色出场硬性限制——只有细纲keyCharacters中明确列出的角色才能在本章拥有以下任何一项：台词（直接引语或间接引语）、动作描写、视角段落、内心独白。未列入keyCharacters的角色在本章中完全不可出场。即使你认为某个角色出现会让情节更丰富，也绝对不可以让其出场。这是与endHook定位同等优先级的铁律。
5. 不得在本章正文中揭露或暗示细纲plotPoints和mustInclude之外的重大信息或剧情转折。如果你的推理能力让你预判到了后续剧情发展，也不要写入本章。严格只写细纲给定的内容。
6. 如果上下文中提供了"本章禁区"信息，其中列出的内容绝对不可在本章出现。
8. 【字数下限】每章正文字数不得低于细纲建议字数的 85%。如果细纲建议 3000 字，则正文至少 2550 字。宁可多写不可少写。当你感觉"写完了"时，检查是否每个情节点都有足够的场景细节、对话和心理活动，如果某个情节点只用了一两句话带过，必须展开。
9. 【情感弧线展开】细纲中标注的情绪弧线每个阶段至少需要 1-2 段文字来呈现。不可跳过任何情绪转折点。特别是"动摇"、"犹豫"、"恐惧"等内向情绪，必须通过内心独白或具体生理反应（如呼吸加快、手指停顿、视线回避）来表现，不可用旁白式总结一笔带过。
10. 【角色性别一致性】严格遵守角色的性别设定。男性角色使用"他"，女性角色使用"她"。以下是核心角色性别表，不得违反：
- 秦刃（男/他）、林桐（男/他）、郑维（男/他）、陆鸣远（男/他）、方远（男/他）、周翰（男/他）、沈明哲（男/他）、王建国（男/他）、陈律师（男/他）、林正阳（男/他）
- 苏可（女/她）、赵谦（女/她）
- M-0（AI系统/它）
如果不确定角色性别，使用角色名而非代词。绝对不允许在同一章中对同一角色混用"他"和"她"。

【章末板块必须严格按模板输出】
- 章末板块必须放在全文最后。
- 总字数≤150字。
- 不得出现章节序号、章节名、角色小剧场、作者抒情。
- 不可省略标签，不可改写标签，不可合并为一段。
- 互动引导不得使用括号包裹。

章末板块必须严格使用以下格式输出，不可省略标签，不可合并为一段（括号内提示不要原样输出，要替换为真实内容；换行与空行必须一字不差）：

【下集预告】
（1-2句画面/台词钩子）

（1句互动引导，不要用括号包裹）

【章末板块示例】
正确示范：
【下集预告】
魏莱建议定价一万。李弈摇了摇头，说出了一个让全场心脏骤停的数字。

求五星好评、求追读，稳定日更不断更。

错误示范（禁止）：
- 与本章剧情无关的悬疑句
- 用括号包裹互动引导
- 超过150字
- 出现章节名或章节序号

你必须严格按"正确示范"的结构输出章末板块：
1）只出现一次"【下集预告】"标签；
2）预告=1~2句与本章强相关的具体画面/台词钩子；
3）互动引导=单独一行、无括号、简短有力。`;

  function requireNonEmpty(value: string, message: string) {
    if (!value || value.trim().length === 0) throw new Error(message);
    return value;
  }

  function extractEndHookFromOutline(rawOutlineContent: string): { text: string; source: string } {
    const endHookRegexes = [
      /【章末钩子】\s*\n([^\n【]+(?:\n(?!【|\n)[^\n【]+)*)/,
      /【章末钩子】\s*[:：]?\s*([^\n]+)/,
      /endHook\s*[:："“”']\s*([^\n"”']+)/i,
    ];

    for (let index = 0; index < endHookRegexes.length; index++) {
      const regex = endHookRegexes[index];
      const match = rawOutlineContent.match(regex);
      if (!match || !match[1]) continue;

      const candidate = match[1].trim();
      if (
        candidate.length > 10 &&
        !/^[（(].*不要|^不得|^禁止|^请勿|不要提前/.test(candidate)
      ) {
        return {
          text: candidate,
          source: `正则#${index + 1}`,
        };
      }
    }

    return { text: '', source: '' };
  }

  // 缓存知识库注入结果，供报告阶段复用，避免重复 I/O
  let injectedPromptResult: InjectedPrompt | null = null;

  let system = "";
  let userPrompt = "";
  let shouldEnsureEnding = false;
  let suggestedWordCount = 3000;
  let endHookText = '';

  // 每个 step 对应的 temperature
  const temperatures: Record<number, number> = {
    1: 0.8,  // 初稿
    2: 0.3,  // 读者反馈
    3: 0.8,  // 二稿
    4: 0.3,  // 审核报告
    5: 0.7,  // 终稿
  };
  const temperature = temperatures[step] ?? 0.8;

  // 每个 step 对应的 max_tokens
  const maxTokensMap: Record<number, number> = {
    1: 8000,  // 初稿
    2: 2000,  // 读者反馈
    3: 8000,  // 二稿
    4: 3000,  // 审核报告
    5: 8000,  // 终稿
  };
  const maxTokens = maxTokensMap[step] ?? 8000;
  const parsedChapterNo = chapterNo ? parseInt(String(chapterNo).replace(/[^0-9]/g, ''), 10) || undefined : undefined;

  if (step === 1) {
    // StoryGuard 约束上下文
    let storyGuardContext = "";
    try {
      const pid = projectId || "";
      const chNum = parsedChapterNo;
      if (pid && chNum) {
        const vol = await getVolumeByChapter(pid, chNum);
        if (vol !== null) {
          storyGuardContext = await assembleStoryGuardContext(pid, vol, chNum, chNum);
        }
      }
    } catch (e) {
      console.warn("[write] StoryGuard 上下文获取失败，跳过:", e);
    }

    // 注入知识库上下文
    let injectedContext = "";
    try {
      const injected = await buildKnowledgeContext({
        projectId: projectId || "",
        chapterDirection: direction || "",
      chapterNo: parsedChapterNo,
      });
      injectedContext = injected.systemPromptAddition;
      injectedPromptResult = injected; // 缓存完整结果，报告阶段直接复用
    } catch (e) {
      console.error("知识库注入失败:", e);
    }

    // StoryGuard 在前，知识库在后
    const contextParts = [storyGuardContext, injectedContext].filter(Boolean).join("\n\n---以下是知识库参考信息---\n\n");
    system = WRITER_SYSTEM_PROMPT + (contextParts ? `\n\n${contextParts}` : "");

    // ── 预处理：否定指令改写 + 反派模板注入 ──
    let processedExtra = extra || "";
    if (processedExtra.trim()) {
      processedExtra = await preprocessCreativeInstructions(
        processedExtra,
        helperLlmCall
      );
    }
    processedExtra = await detectAndInjectAntagonistTemplate(
      direction,
      processedExtra,
      helperLlmCall
    );

    if (outlineContent && outlineContent.trim()) {
      // 尝试从细纲中提取结构化字段
      let connectionToPrevText = '';
      let keyCharactersList = '';
      let plotPointsOrdered = '';
      try {
        // 细纲可能是JSON对象或包含这些字段的结构化文本
        console.log('[Step1细纲诊断] 尝试JSON解析，outlineContent前200字:', outlineContent.substring(0, 200));
        const outlineObj = JSON.parse(outlineContent);
        endHookText = outlineObj.endHook || '';
        connectionToPrevText = outlineObj.connectionToPrev || '';
        if (Array.isArray(outlineObj.keyCharacters)) {
          keyCharactersList = outlineObj.keyCharacters.join('、');
        }
        if (Array.isArray(outlineObj.plotPoints)) {
          plotPointsOrdered = outlineObj.plotPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n');
        }
      } catch {
        console.log('[Step1细纲诊断] JSON解析失败，尝试正则提取。outlineContent前200字:', outlineContent.substring(0, 200));
        const extractedEndHook = extractEndHookFromOutline(outlineContent);
        if (extractedEndHook.text) {
          endHookText = extractedEndHook.text;
          console.log('[Step1细纲诊断] endHook提取成功，来源:' + extractedEndHook.source + '，内容:', endHookText.substring(0, 80));
        } else {
          console.log('[Step1细纲诊断] endHook正则提取失败');
        }

        // 匹配【与上一章衔接】或【与上一章的衔接】标签
        const connMatch = outlineContent.match(/【与上一章(?:的)?衔接】\s*\n?([\s\S]+?)(?:\n\n|\n【|$)/)
          || outlineContent.match(/connectionToPrev["""：:]\s*(.+?)(?:\n|$)/i);
        if (connMatch) connectionToPrevText = connMatch[1].trim();

        // 匹配【关键角色】标签
        const charMatch = outlineContent.match(/【关键角色】\s*\n?([\s\S]+?)(?:\n\n|\n【|$)/);
        if (charMatch && !keyCharactersList) {
          keyCharactersList = charMatch[1].trim();
        }

        // 匹配【情节点】或【关键情节点】标签，提取编号列表
        const plotMatch = outlineContent.match(/【(?:关键)?情节点】\s*\n?([\s\S]+?)(?:\n\n|\n【|$)/);
        if (plotMatch && !plotPointsOrdered) {
          plotPointsOrdered = plotMatch[1].trim();
        }

        // 兜底：如果正则也失败，尝试从outline.json中直接读取
        if ((!endHookText || endHookText.length < 10) && chapterNo) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const dataRoot = path.join(process.cwd(), 'data', 'projects');
            if (typeof projectId === 'string' && projectId) {
              const normalizedChapterNo = parseInt(String(chapterNo).replace(/[^0-9]/g, ''), 10);
              const outlinePath = path.join(dataRoot, projectId, 'knowledge', 'outline.json');
              if (fs.existsSync(outlinePath)) {
                const outlineData = JSON.parse(fs.readFileSync(outlinePath, 'utf-8'));
                for (const vol of outlineData.volumes || []) {
                  for (const ch of vol.chapters || []) {
                    if (ch.chapterNum === normalizedChapterNo && ch.endHook) {
                      endHookText = ch.endHook;
                      console.log('[endHook兜底] 从outline.json成功读取endHook:', endHookText.substring(0, 60));
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.log('[endHook兜底] 读取outline.json失败:', e);
          }
        }
      }

      const wordCountMatch = outlineContent.match(/(?:字数建议|suggestedWordCount|建议字数)[""":：]*\s*(\d+)/i);
      if (wordCountMatch) {
        suggestedWordCount = parseInt(wordCountMatch[1], 10);
      }

      const openingWords = 300;
      const endingWords = 500;
      const bodyWords = suggestedWordCount - openingWords - endingWords;
      const plotPointsList = plotPointsOrdered
        ? plotPointsOrdered.split(/\n/).filter((line: string) => line.trim().length > 0)
        : [];
      const avgWordsPerPoint = plotPointsList.length > 0
        ? Math.floor(bodyWords / plotPointsList.length)
        : bodyWords;

      let skeleton = `\n\n【正文骨架（严格按以下结构和顺序输出，禁止调换段落顺序，禁止合并或跳过任何段落）】\n`;
      skeleton += `\n=== 第一段：开头承接（约${openingWords}字）===\n`;
      skeleton += `承接内容：${connectionToPrevText || '自然承接上章结尾'}\n`;
      skeleton += `要求：直接从上章结尾的场景或情绪切入，不要时间跳跃，不要用"X天后"开头。\n`;

      if (plotPointsList.length > 0) {
        plotPointsList.forEach((point: string, index: number) => {
          const cleanPoint = point.replace(/^\d+[.、)\]]\s*/, '').trim();
          if (cleanPoint) {
            skeleton += `\n=== 第${index + 2}段：${cleanPoint}（约${avgWordsPerPoint}字）===\n`;
            skeleton += `要求：完整展开此情节点。必须包含以下至少两项：具体的场景描写（环境、光线、声音）、至少一轮对话、一段内心独白、角色的肢体动作或微表情。不可一两句话带过。\n`;
          }
        });
      }

      skeleton += `\n=== 最后一段：章末收束（约${endingWords}字，必须包含 endHook）===\n`;
      skeleton += `endHook 原文：${endHookText || '按细纲章末钩子写'}\n`;
      skeleton += `要求：将 endHook 自然融入叙事，作为本章最后的悬念或转折。endHook 的核心语句必须出现在正文的最后 500 字内。\n`;

      skeleton += `\n【总字数目标】${suggestedWordCount}字（允许浮动范围：${Math.floor(suggestedWordCount * 0.85)}-${Math.ceil(suggestedWordCount * 1.1)}字）\n`;

      console.log('[Step1骨架] plotPoints数量:', plotPointsList.length, '目标字数:', suggestedWordCount, '每段配额:', avgWordsPerPoint);

      userPrompt = `【本章细纲（必须严格遵循）】
${outlineContent}

【结构执行指令（与细纲同等优先级）】

一、开头段（前300字）：
${connectionToPrevText ? `- 本章承接点：${connectionToPrevText}` : '- 请根据细纲中的connectionToPrev自然衔接上一章结尾'}
- 开头第一个场景必须与上一章结尾呼应，不得凭空跳转

二、中段主体：
${skeleton}
- mustInclude中的每一项都必须在正文中体现
- 不要自行添加细纲未提及的重大剧情转折
${keyCharactersList ? `- 【铁律】允许出场的角色仅限：${keyCharactersList}。除这些角色外，任何其他角色不得在本章出现、说话或有动作描写。这是不可违反的硬性规定。` : ''}

三、结尾段（最后500字，章末板块之前）：
${endHookText ? `- 本章结尾的最后一个叙事动作必须是：\n"${endHookText}"\n- 这段内容必须出现在正文最后500字以内，紧接在章末板块之前。不得将此内容提前到中段使用。` : '- 严格按照细纲中的endHook作为本章最后一个叙事动作，出现在正文最后500字以内'}

特殊指令（可选）：
${processedExtra || "无"}`;
    } else {
      userPrompt = `章节方向：\n${requireNonEmpty(direction, "Step1：章节方向不能为空")}\n\n【字数目标】请写出至少 2500 字的正文。每个场景至少包含环境描写、对话和心理活动三个要素。不要写完核心情节就停下，要充分展开每个场景。\n\n特殊指令（可选）：\n${processedExtra || "无"}`;
    }
    shouldEnsureEnding = true;
  } else if (step === 2) {
    system = READER_SIMULATOR_SYSTEM_PROMPT;
    userPrompt = requireNonEmpty(tab1, "Step2：需要Tab1初稿内容作为输入");
    shouldEnsureEnding = false;
  } else if (step === 3) {
    system = WRITER_SYSTEM_PROMPT;
    requireNonEmpty(tab1, "Step3：需要Tab1初稿内容作为输入");
    requireNonEmpty(tab2, "Step3：需要Tab2读者反馈作为输入");
    userPrompt = `【初稿】\n${tab1}\n\n【读者反馈】\n${tab2}\n\n固定指令：\n根据读者反馈，重点修改'划走预警'标注的段落。保持其余部分不变。不要重写全文。`;
    shouldEnsureEnding = true;
  } else if (step === 4) {
    system = QA_EDITOR_SYSTEM_PROMPT;
    requireNonEmpty(tab3, "Step4：需要Tab3二稿内容作为输入");
    const meta =
      `小说背景： ${background || "未提供"}\n` +
      `当前章节序号： ${chapterNo || "未提供"}\n` +
      `近3章爽感类型： ${last3ShuangTypes || "未提供"}`;
    const bannedExpressionsCheck = `\n\n【额外审核要求】\n请检查正文中是否出现以下套路化表达（或其同义变体），如果出现请在审核报告中标记为"套路化表达"类型的问题并建议替换：\n瞳孔骤缩、嘴角勾起弧度、倒吸冷气、指节泛白、冷汗浸透衬衫、摇晃高脚杯/红酒杯、声音平静得可怕、目光如炬、全场死寂针落可闻、高深莫测、不容置疑、单独成段的拟声词（如"轰——！"）`;
    
    // 加入细纲内容作为审核对照基准
    let outlineBlock = "";
    if (outlineContent && outlineContent.trim()) {
      outlineBlock = `\n\n【本章细纲（审核对照基准）】\n${outlineContent}`;
    } else if (direction && direction.trim()) {
      outlineBlock = `\n\n【章节方向（审核对照基准）】\n${direction}`;
    }
    
    // 诊断日志
    console.log("=== Step 4 细纲注入诊断 ===");
    console.log("outlineContent 是否存在:", !!outlineContent, "长度:", outlineContent?.length || 0);
    console.log("direction 是否存在:", !!direction, "长度:", direction?.length || 0);
    console.log("outlineBlock 内容:", outlineBlock?.substring(0, 200) || "空");
    
    userPrompt = `请按你的Initialization要求先读元信息，再审稿。\n\n${meta}\n\n${bibleSummary}${outlineBlock}${bannedExpressionsCheck}\n\n【正文（二稿）】\n${tab3}`;
    shouldEnsureEnding = false;
  } else if (step === 5) {
    system = WRITER_SYSTEM_PROMPT;
    requireNonEmpty(tab3, "Step5：需要Tab3二稿内容作为输入");
    requireNonEmpty(tab4, "Step5：需要Tab4审核报告作为输入");
    userPrompt = `【二稿】\n${tab3}\n\n【审核报告】\n${tab4}\n\n固定指令：\n根据审核报告做最终修正。红线问题必改，逻辑硬伤必改，润色建议参考执行。不要改动审核未标记的段落。不要重写全文。`;
    shouldEnsureEnding = true;
  }

  // 步骤 1、3、5：添加字数要求
  if (step === 1 || step === 3 || step === 5) {
    system += "\n\n【字数要求】本章正文2000-3500字。情节紧凑推进，不要为凑字数而添加无关描写。每个情节点自然展开即可，重点场景可以多写细节和对话，过渡场景简洁处理。";
    
    // 新增风格约束
    system += "\n\n【风格约束（必须严格遵守）】\n1. 对话简洁：单段对话不超过3行，信息密度高但措辞精炼，避免角色长篇大论式的独白\n2. 留白优先：情感高潮用动作和沉默表达，少用形容词直接描述情绪。角色的力量感来自沉默和克制，而非外在描写\n3. 章末留悬念：最后一个场景只揭示问题或制造悬念，不给出解决方案，让读者带着好奇心等待下一章\n4. 修辞克制：每段最多一个比喻，避免连续堆叠形容词和修饰语。宁可少写一个华丽的句子，也不要让文字显得臃肿\n5. 节奏感：场景切换要干脆，过渡场景一笔带过，重点场景才展开细节。保持网文的快节奏阅读体验";
    
    // 番茄网文风格铁律（最高优先级）
    system += "\n\n【番茄网文风格铁律（最高优先级）】\n" +
"1. 段落长度：每段不超过3行（手机屏幕可见范围内），禁止出现超过5行的'大砖块'段落\n" +
"2. 对话密度：每500字中至少包含2-3组对话，用对话推动剧情而非大段叙述\n" +
`3. 内心OS：主角${protagonistName}的内心独白必须频繁出现，用（括号）或独立短段呈现，体现'表面装逼/内心狂喜'的反差喜感\n` +
"4. 情绪直给：读者的爽点、笑点、泪点必须在3行之内引爆，不要铺垫过长\n" +
"5. 节奏公式：每800字必须有一个小高潮（一个反转/一句金句/一个爽点），每2000字必须有一个大高潮\n" +
"6. 章末钩子：最后一段必须制造强烈悬念或情绪冲击，让读者忍不住点'下一章'\n" +
"7. 禁止事项：禁止学术化长句、禁止连续超过3段的纯描写无对话、禁止文青式抒情散文腔";

    // 负面词表（禁用套路化表达）
    system += "\n\n【禁用表达清单（绝对不允许出现以下词句或同义变体）】\n" +
      "- 瞳孔骤缩 / 瞳孔骤然收缩 / 瞳孔猛地一缩\n" +
      "- 嘴角勾起一抹XX的弧度 / 嘴角微微上扬勾出一抹XX\n" +
      "- 倒吸一口冷气\n" +
      "- 指节泛白 / 握紧的指节泛白\n" +
      "- 冷汗浸透了衬衫 / 冷汗顺着脊背滑落\n" +
      "- 摇晃高脚杯 / 猩红的液体在杯中旋转 / 端着红酒杯看着落地窗\n" +
      "- 声音平静得可怕\n" +
      "- 目光如炬\n" +
      "- 全场死寂，针落可闻\n" +
      "- 高深莫测的笑意 / 高深莫测的表情\n" +
      "- 不容置疑的语气 / 不容置疑的疯狂\n" +
      "- 轰——！（单独成段的拟声词）\n" +
      "- 连续使用'XX顿了顿'超过1次/章\n" +
      "- 面无表情，XX却暴露了内心的XX\n" +
      "- 如同坠崖般 / 如同XX般（连续比喻超过2个）\n" +
      "\n用动作、对话、节奏变化来表达情绪，而不是依赖以上模板化描写。" +
      "例如：用'他放下茶杯，手指在桌面敲了三下'代替'他的目光如炬'；" +
      "用'魏莱没说话，转身走向控制台'代替'魏莱的瞳孔骤然收缩'。";

    if (step === 1 || step === 3) {
      system += `\n\n${ANTAGONIST_SCENE_DIVERSITY_RULE}`;
    }
  }

  // ── 主生成 ──
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: system },
    { role: 'user', content: userPrompt },
  ];

  const isStep4 = step === 4;
  const promptChars = `${system}\n\n${userPrompt}`.length;
  const estimatedPromptTokens = estimatePromptTokens(`${system}\n\n${userPrompt}`);
  const effectiveMaxTokens = model.includes('gemini') && step === 4 ? 4096 : maxTokens;

  if (isStep4) {
    console.log("=== Step 4 审核报告诊断：Prompt 模板核心信息 ===");
    console.log({
      systemPromptPreview: truncateForLog(system, 1500),
      userPromptPreview: truncateForLog(userPrompt, 2500),
      promptChars,
      estimatedPromptTokens,
      model,
      temperature,
      configuredMaxTokens: maxTokens,
      effectiveMaxTokens,
      geminiThinkingBudget: model.includes('gemini') ? 1024 : undefined,
    });
  }
  
  // 构建模型调用参数（根据模型类型选择参数）
  let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

  try {
    if (model.includes('gemini')) {
      // Gemini 模型使用专用参数
      const geminiParams: any = {
        model: model,
        messages: messages,
        temperature: temperature,
        stream: true as const,
        max_completion_tokens: step === 4 ? 4096 : maxTokens,
      };
      if (step === 4) {
        geminiParams.thinking_budget = 1024;
      }
      stream = await client.chat.completions.create(geminiParams) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
    } else {
      // 其他模型使用标准参数
      stream = await client.chat.completions.create({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: true,
      });
    }
  } catch (error) {
    if (isStep4) {
      console.error("=== Step 4 审核报告诊断：create 调用失败 ===");
      console.error({
        model,
        temperature,
        configuredMaxTokens: maxTokens,
        effectiveMaxTokens,
        promptChars,
        estimatedPromptTokens,
        error,
      });
    }
    throw error;
  }

  // ── 硬约束后处理（仅对写手步骤 1/3/5 执行）──
  // 方案：流式返回，同时异步执行约束核验
  if (shouldEnsureEnding) {
    const constraintLog: ConstraintLogEntry[] = [];
    const encoder = new TextEncoder();

    // 创建流式响应
    const textStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          // 收集完整文本用于后处理
          let manuscript = "";
          
          // 流式传递给前端，同时收集完整内容
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              manuscript += content;
              // 实时流式返回给前端
              controller.enqueue(encoder.encode(content));
            }
          }
          
          // 流关闭后再执行后处理（不影响前端接收）
          // 通过 ensureChapterEndingTextStream 处理章末板块
          const endingStream = ensureChapterEndingTextStream(
            stringToStream(manuscript)
          );

          // 重新收集经过章末处理的小说正文
          const endingReader = endingStream.getReader();
          let finalManuscrip = "";
          while (true) {
            const { value, done } = await endingReader.read();
            if (done) break;
            finalManuscrip += value;
          }

          // A. 尾部硬切
          const trimmed = trimTailBoilerplate(finalManuscrip);
          if (trimmed.length < finalManuscrip.length) {
            constraintLog.push({
              check: "尾部硬切",
              status: "已执行",
              detail: `删除了 ${finalManuscrip.length - trimmed.length} 个字符的尾部样板文字`,
            });
            finalManuscrip = trimmed;
          } else {
            constraintLog.push({ check: "尾部硬切", status: "无需处理", detail: "未检测到尾部样板" });
          }

          // --- Step5 截断检测 ---
          // 如果 Step5 输出不到 Step3 二稿的 50%，判定为 API 截断，回退到二稿
          const step3Content = tab3;
          if (step === 5 && step3Content && finalManuscrip) {
            const step5Length = finalManuscrip.trim().length;
            const step3Length = step3Content.trim().length;

            if (step3Length > 1000 && step5Length < step3Length * 0.5) {
              console.warn(`[截断检测] Step5 疑似被截断: Step5=${step5Length}字, Step3=${step3Length}字 (${Math.round(step5Length / step3Length * 100)}%). 回退到 Step3 二稿。`);
              constraintLog.push({
                check: 'Step5截断检测',
                status: '已回退到二稿',
                detail: `Step5=${step5Length}字, Step3=${step3Length}字, 比例=${Math.round(step5Length / step3Length * 100)}%`,
              });
              finalManuscrip = step3Content;
            } else {
              constraintLog.push({
                check: 'Step5截断检测',
                status: '通过',
                detail: `Step5=${step5Length}字, Step3=${step3Length}字`,
              });
            }
          }

          // B. 锚定文本检查
          if (anchors.length > 0) {
            const missingAnchors = checkAnchors(finalManuscrip, anchors);
            if (missingAnchors.length === 0) {
              constraintLog.push({
                check: "锚定文本",
                status: "全部命中",
                detail: `共 ${anchors.length} 条锚定文本全部存在`,
              });
            } else {
              constraintLog.push({
                check: "锚定文本",
                status: "存在缺失",
                detail: missingAnchors
                  .map(
                    (m) =>
                      `缺失：${m.expected_text}（说话人：${m.speaker}，位置：${m.position}，最高相似度：${((m.best_match_ratio ?? 0) * 100).toFixed(0)}%）`
                  )
                  .join("\n"),
              });
            }
          } else {
            constraintLog.push({ check: "锚定文本", status: "已跳过", detail: "未配置锚定文本" });
          }

          // 结构合规门控：检查 endHook 位置
          let endHookAnchor: { text: string; position: string; speaker?: string } | null = null;
          try {
            if (outlineContent && outlineContent.trim()) {
              console.log('[结构门控细纲诊断] 尝试JSON解析，outlineContent前200字:', outlineContent?.substring(0, 200));
              const outlineObj = JSON.parse(outlineContent);
              if (outlineObj.endHook) {
                endHookAnchor = { text: outlineObj.endHook, position: 'ending' };
              }
            }
          } catch {
            // 非JSON格式的细纲，尝试正则提取
            console.log('[结构门控细纲诊断] JSON解析失败，尝试正则。outlineContent前200字:', outlineContent?.substring(0, 200));
            const extractedEndHook = extractEndHookFromOutline(outlineContent);
            if (extractedEndHook.text) {
              endHookAnchor = { text: extractedEndHook.text, position: 'ending' };
              console.log('[结构门控] endHook提取成功，来源:' + extractedEndHook.source + '，内容:', extractedEndHook.text.substring(0, 80));
            }
          }

          // 兜底：如果正则也失败，尝试从outline.json中直接读取
          if ((!endHookAnchor || (endHookAnchor.text && endHookAnchor.text.length < 10)) && chapterNo) {
              try {
                const dataRoot = path.join(process.cwd(), 'data', 'projects');
                if (typeof projectId === 'string' && projectId) {
                  const normalizedChapterNo = parseInt(String(chapterNo).replace(/[^0-9]/g, ''), 10);
                  const outlinePath = path.join(dataRoot, projectId, 'knowledge', 'outline.json');
                  if (fs.existsSync(outlinePath)) {
                    const outlineData = JSON.parse(fs.readFileSync(outlinePath, 'utf-8'));
                    for (const vol of outlineData.volumes || []) {
                      for (const ch of vol.chapters || []) {
                        if (ch.chapterNum === normalizedChapterNo && ch.endHook) {
                          const endHookText = ch.endHook;
                          endHookAnchor = { text: endHookText, position: 'ending' };
                          console.log('[endHook兜底] 从outline.json成功读取endHook:', endHookText.substring(0, 60));
                        }
                      }
                    }
                  }
                }
              } catch (e) {
                console.log('[endHook兜底] 读取outline.json失败:', e);
              }
          }

          // --- 全量硬约束检测 ---
          let allKnownCharacters: string[] = [];
          try {
            if (projectId) {
              const projectCharacters = getAllCharacters(projectId);
              if (Array.isArray(projectCharacters) && projectCharacters.length > 0) {
                allKnownCharacters = projectCharacters
                  .map((c) => c.name?.trim() || '')
                  .filter((n) => n.length >= 2);
                console.log('[硬约束] 角色库来源: getAllCharacters/bible.sqlite');
              }

              if (allKnownCharacters.length === 0) {
                const charsPath = path.join(process.cwd(), 'data', 'projects', projectId, 'knowledge', 'characters.json');
                if (fs.existsSync(charsPath)) {
                  const charsRaw = fs.readFileSync(charsPath, 'utf-8');
                  const charsData = JSON.parse(charsRaw);
                  if (Array.isArray(charsData)) {
                    allKnownCharacters = charsData
                      .map((c: any) => c.name || c.角色名 || c.characterName || '')
                      .filter((n: string) => n.length >= 2);
                  } else if (typeof charsData === 'object' && charsData !== null) {
                    allKnownCharacters = Object.values(charsData)
                      .map((c: any) => c.name || c.角色名 || c.characterName || '')
                      .filter((n: string) => n.length >= 2);
                  }
                  console.log('[硬约束] 角色库来源: characters.json');
                }
              }
            }
            console.log('[硬约束] 角色库加载:', allKnownCharacters.length, '个角色');
          } catch (e) {
            console.warn('[硬约束] 角色库读取失败，跳过角色检测:', e);
          }

          let patternKeywords: string[] = [];
          try {
            if (projectId) {
              const factsPath = path.join(process.cwd(), 'data', 'projects', projectId, 'knowledge', 'facts.json');
              if (fs.existsSync(factsPath)) {
                const factsRaw = fs.readFileSync(factsPath, 'utf-8');
                const factsData = JSON.parse(factsRaw);
                const rawPatternKeywords = factsData.patternKeywords || factsData.pattern_keywords || [];
                if (Array.isArray(rawPatternKeywords)) {
                  patternKeywords = rawPatternKeywords;
                } else if (rawPatternKeywords && typeof rawPatternKeywords === 'object') {
                  patternKeywords = Object.keys(rawPatternKeywords);
                } else {
                  patternKeywords = [];
                }
                patternKeywords = Array.isArray(patternKeywords) ? patternKeywords : [];
              }
            }
            console.log('[硬约束] patternKeywords 加载:', patternKeywords.length, '条');
          } catch (e) {
            console.warn('[硬约束] patternKeywords 读取失败，跳过重复检测:', e);
          }

          let previousChaptersText = '';
          try {
            if (projectId && parsedChapterNo) {
              const chaptersDir = path.join(process.cwd(), 'data', 'projects', projectId, 'chapters');
              if (fs.existsSync(chaptersDir)) {
                const prevNums = [parsedChapterNo - 2, parsedChapterNo - 1].filter((n) => n > 0);
                for (const prevNo of prevNums) {
                  const candidates = [
                    path.join(chaptersDir, `${prevNo}.json`),
                    path.join(chaptersDir, `chapter-${prevNo}.json`),
                    path.join(chaptersDir, `ch${prevNo}.json`)
                  ];
                  for (const candidate of candidates) {
                    if (fs.existsSync(candidate)) {
                      const prevData = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
                      previousChaptersText += (prevData.content || prevData.manuscript || prevData.text || prevData.finalText || '') + '\n';
                      break;
                    }
                  }
                }
              }
            }
            console.log('[硬约束] 前章文本加载:', previousChaptersText.length, '字');
          } catch (e) {
            console.warn('[硬约束] 前章读取失败，跳过跨章检测:', e);
          }

          let keyCharsForCheck: string[] = [];
          try {
            const kcMatch = outlineContent.match(/(?:【关键角色】|keyCharacters)["""：:]*\s*\n?([\s\S]+?)(?:\n\n|\n【|$)/);
            if (kcMatch) {
              keyCharsForCheck = kcMatch[1]
                .split(/[,，、\n]/)
                .map((s: string) => s.trim())
                .filter((s: string) => s.length >= 2);
            }
            console.log('[硬约束] keyCharacters:', keyCharsForCheck);
          } catch (e) {
            console.warn('[硬约束] keyCharacters 提取失败:', e);
          }

          const constraintReport: HardConstraintReport = runFullConstraintCheck({
            manuscript: finalManuscrip,
            anchors: endHookAnchor ? [endHookAnchor as AnchorItem] : [],
            keyCharacters: keyCharsForCheck,
            allKnownCharacters,
            suggestedWordCount: suggestedWordCount || 3000,
            patternKeywords,
            previousChaptersText
          });

          console.log(constraintReport.summary);
          console.log('[硬约束] 单项统计', {
            unauthorizedHardCount: checkUnauthorizedCharacters(finalManuscrip, keyCharsForCheck, allKnownCharacters).filter((c) => c.severity === 'hard').length,
            wordCountPass: checkWordCount(finalManuscrip, suggestedWordCount || 3000).pass,
            repetitionCount: checkPatternRepetition(finalManuscrip, patternKeywords, previousChaptersText).length,
            genderViolationCount: constraintReport.genderViolations.filter((g) => g.count >= 2).length,
          });

          if (constraintReport.unauthorizedCharacters.length > 0) {
            console.log('[硬约束-角色详情]', JSON.stringify(constraintReport.unauthorizedCharacters));
          }
          if (constraintReport.patternRepetition.length > 0) {
            console.log('[硬约束-重复表达]', JSON.stringify(constraintReport.patternRepetition));
          }
          if (constraintReport.genderViolations.length > 0) {
            console.log('[硬约束-性别代词]', JSON.stringify(constraintReport.genderViolations));
          }
          if (!constraintReport.wordCount.pass) {
            console.log('[硬约束-字数]', JSON.stringify(constraintReport.wordCount));
          }

          let activeConstraintReport: HardConstraintReport = constraintReport;

          if (step === 5) {
            const MAX_FIX_RETRIES = 2;
            let fixAttempt = 0;

            while (!activeConstraintReport.overallPass && fixAttempt < MAX_FIX_RETRIES) {
              fixAttempt += 1;

              const criticalAnchorIssues = activeConstraintReport.anchorCheck.filter((r) =>
                r.type === 'ANCHOR_MISSING' || r.type === 'ANCHOR_WRONG_POSITION'
              );
              const unauthorizedHardIssues = activeConstraintReport.unauthorizedCharacters.filter((c) => c.severity === 'hard');
              const repetitionIssues = activeConstraintReport.patternRepetition;
              const genderIssues = (activeConstraintReport.genderViolations || []).filter((g) => g.count >= 2);
              const wordCountIssue = activeConstraintReport.wordCount.pass
                ? ''
                : `- 字数不足：当前 ${activeConstraintReport.wordCount.actual} 字，目标至少 ${activeConstraintReport.wordCount.minimum} 字。需要在不偏离细纲的前提下补足内容。`;

              const fixReasons = [
                ...criticalAnchorIssues.map((issue) => `- endHook 问题：${issue.message || `${issue.type} / ${issue.expected_text}`}`),
                ...unauthorizedHardIssues.map((issue) => `- 未授权角色：${issue.name}（出现 ${issue.count} 次${issue.hasDialogue ? '，含对话' : ''}）`),
                ...genderIssues.map((issue) => {
                  const rule = getPronounRule(issue.character);
                  const genderName = rule?.genderLabel || (issue.expectedPronoun === '她' ? '女' : issue.expectedPronoun === '他' ? '男' : 'AI系统');
                  return `- 角色性别错误：角色"${issue.character}"是${genderName}，必须使用"${issue.expectedPronoun}"作为代词，当前错误使用了"${issue.wrongPronoun}"共${issue.count}处`;
                }),
                ...repetitionIssues.map((issue) => `- 重复表达：${issue.pattern}（本章 ${issue.countInCurrent} 次${issue.foundInPrevious ? '，且前章也出现' : ''}）`),
                ...(wordCountIssue ? [wordCountIssue] : []),
              ];

              const fixPrompt = `你现在正在执行 Step5 的自动定向修复。请基于“当前终稿”做最小必要修改，只修复下列硬约束问题，不要重写全文，不要改动未被点名的问题段落。\n\n【当前终稿】\n${finalManuscrip}\n\n【本章细纲】\n${outlineContent || '无'}\n\n【审核报告】\n${tab4 || '无'}\n\n【必须修复的问题】\n${fixReasons.length > 0 ? fixReasons.join('\n') : '- 存在未通过的硬约束，请按细纲与审核报告进行最小修复。'}\n\n【硬性修复要求】\n1. 必须保留当前终稿已成立的剧情、段落结构与大部分原文，仅对必要位置做局部修改。\n2. 如果存在 endHook 问题，必须让以下章末钩子出现在正文最后 500 字以内，且成为章末板块之前的最后一个叙事动作：${endHookText || endHookAnchor?.text || '按细纲 endHook 执行'}\n3. 如果存在未授权角色，必须删除其台词、动作、视角或改写为细纲允许出场的角色。\n4. 如果字数不足，只能补写细纲中已有情节点的场景、对话、心理活动，不得新增细纲之外的重大转折。\n5. 如果存在重复表达，必须改写为不同表述，避免套话。\n6. 如果存在角色性别错误，必须逐一修正对应代词。男性角色只能使用“他”，女性角色只能使用“她”，M-0 只能使用“它”；只修改错误代词及其紧邻必要语句，不得借机改写其他内容。\n7. 必须保留并正确输出章末板块。\n\n只输出修复后的完整正文，不要解释。`;

              console.log(`[自动修复] 第 ${fixAttempt} 次尝试开始`, {
                overallPass: activeConstraintReport.overallPass,
                anchorIssues: criticalAnchorIssues.length,
                unauthorizedHardIssues: unauthorizedHardIssues.length,
                repetitionIssues: repetitionIssues.length,
                wordCountPass: activeConstraintReport.wordCount.pass,
              });

              const fixableManuscript = finalManuscrip;
              const repairedManuscript = (await callModelWithConfig(fixPrompt, "终稿")).trim();
              if (!repairedManuscript) {
                console.warn(`[自动修复] 第 ${fixAttempt} 次尝试返回空文本，停止重试`);
                break;
              }

              const fixedText = repairedManuscript;
              const fixRetryCount = fixAttempt;
              if (fixedText.length < 500) {
                console.warn(`[自动修复] 第 ${fixRetryCount} 次修复后文本过短(${fixedText.length})，放弃此次修复`);
                break;
              }
              // 修复结果不应该比修复前大幅缩短
              if (fixedText.length < fixableManuscript.length * 0.5) {
                console.warn(`[自动修复] 第 ${fixRetryCount} 次修复后文本反而大幅缩短(${fixedText.length} < ${fixableManuscript.length}*0.5)，放弃此次修复`);
                break;
              }

              finalManuscrip = trimTailBoilerplate(repairedManuscript);
              activeConstraintReport = runFullConstraintCheck({
                manuscript: finalManuscrip,
                anchors: endHookAnchor ? [endHookAnchor as AnchorItem] : [],
                keyCharacters: keyCharsForCheck,
                allKnownCharacters,
                suggestedWordCount: suggestedWordCount || 3000,
                patternKeywords,
                previousChaptersText,
              });

              console.log(`[自动修复] 第 ${fixAttempt} 次尝试后结果`, {
                overallPass: activeConstraintReport.overallPass,
                summary: activeConstraintReport.summary,
              });
            }

            constraintLog.push({
              check: '自动修复',
              status: activeConstraintReport.overallPass ? '完成' : '仍有未通过项',
              detail: activeConstraintReport.summary,
            });
          }

          if (endHookAnchor && finalManuscrip) {
            const criticalIssues = activeConstraintReport.anchorCheck.filter((r) =>
              r.type === 'ANCHOR_MISSING' || r.type === 'ANCHOR_WRONG_POSITION'
            );

            if (criticalIssues.length > 0) {
              console.log('[结构门控] 发现endHook问题:', JSON.stringify(criticalIssues, null, 2));
              constraintLog.push({
                check: '结构门控',
                status: '发现endHook问题',
                detail: criticalIssues
                  .map((issue) => issue.message || `type=${issue.type}，target=${issue.expected_text}`)
                  .join('\n'),
              });
            } else if (!activeConstraintReport.overallPass) {
              console.log('[结构门控] 全量硬约束未通过:', activeConstraintReport.summary);
              constraintLog.push({
                check: '结构门控',
                status: '全量硬约束未通过',
                detail: activeConstraintReport.summary,
              });
            } else {
              console.log('[结构门控] endHook位置检查通过');
              constraintLog.push({
                check: '结构门控',
                status: '通过',
                detail: activeConstraintReport.summary,
              });
            }
          } else {
            constraintLog.push({
              check: '结构门控',
              status: '已跳过',
              detail: 'endHook锚点缺失或正文为空',
            });
          }

          try {
            if (projectId && parsedChapterNo) {
              const chapterState = await extractChapterState(
                parsedChapterNo,
                finalManuscrip,
                outlineContent,
                async (prompt: string) => {
                  return callModelWithConfig(prompt, "审核报告");
                }
              );
              saveChapterState(projectId, chapterState);
              console.log('[状态追踪] 章节状态已保存:', JSON.stringify(chapterState).substring(0, 200));
            }
          } catch (e) {
            console.warn('[状态追踪] 提取失败，不影响主流程:', e);
          }

          // C. 禁止项检测
          if (forbiddenList.length > 0) {
            const violations = await checkForbiddenRules(
              finalManuscrip,
              forbiddenList,
              helperLlmCall
            );
            if (violations.length === 0) {
              constraintLog.push({
                check: "禁止项",
                status: "无违规",
                detail: `共检查 ${forbiddenList.length} 条规则，均未违反`,
              });
            } else {
              constraintLog.push({
                check: "禁止项",
                status: "发现违规",
                detail: violations
                  .map(
                    (v) =>
                      `[${v.severity}] 规则：${v.rule}\n证据：${v.evidence}`
                  )
                  .join("\n---\n"),
              });
            }
          } else {
            constraintLog.push({ check: "禁止项", status: "已跳过", detail: "未配置禁止规则" });
          }

          // 生成执行报告（只输出到 console.log，不返回给前端）
          const reportLines = [
            "",
            "─────────────────────────────────",
            "【硬约束执行报告】",
            ...constraintLog.map(
              (entry) =>
                `✦ ${entry.check}：${entry.status}\n  ${entry.detail.replace(/\n/g, "\n  ")}`
            ),
            "─────────────────────────────────",
          ];
          
          // 添加知识库注入报告（复用已缓存的注入结果，无需重复 I/O）
          if (step === 1 && injectedPromptResult && injectedPromptResult.injectedItems.length > 0) {
            reportLines.push(
              "",
              "─────────────────────────────────",
              "【知识库注入报告】",
              `- 注入内容：${injectedPromptResult.injectedItems.join(", ")}`,
              `- 预估token消耗：约${Math.floor(injectedPromptResult.systemPromptAddition.length * 1.5)} tokens`,
              "─────────────────────────────────"
            );
          }
          
          const report = reportLines.join("\n");
          
          // 输出报告到服务端 console
          console.log(report);
          
          // 关闭流
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  }

  // 非写手步骤：直接流式返回
  const readableStream = isStep4
    ? createStep4DiagnosticStream(stream, {
        model,
        temperature,
        maxTokens,
        effectiveMaxTokens,
        promptChars,
        estimatedPromptTokens,
        systemChars: system.length,
        userPromptChars: userPrompt.length,
      })
    : openaiStreamToReadable(stream);
  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
