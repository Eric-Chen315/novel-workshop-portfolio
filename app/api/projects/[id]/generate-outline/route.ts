import { NextResponse } from "next/server";
import OpenAI from "openai";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

import { loadOutline } from "@/lib/storage/knowledgeStore";
import { getProjectChaptersDir, getProjectKnowledgeDir } from "@/lib/storage/projectStore";
import { assembleStoryGuardContext } from "@/lib/knowledgeInjector";

export const runtime = "nodejs";

type GenerateOutlineRequest = {
  volumeNum: number;
  volumeTitle: string;
  startChapter: number;
  endChapter: number;
  volumeSummary: string;
  characters: string[];
  constraints: string;
};

type BibleCharacterRow = {
  name?: string;
  role?: string;
  aliases?: string;
  appearance?: string;
  background?: string;
  personality?: string;
  speechStyle?: string;
  behaviorRules?: string;
  growthArc?: string;
  currentStatus?: string;
  sampleDialogue?: string;
  keyEvents?: string;
};

type GlobalRuleRow = {
  title?: string;
  content?: string;
  priority?: number;
};

type WorldSettingRow = {
  name?: string;
  category?: string;
  description?: string;
  currentStatus?: string;
  volume?: string;
};

type GeneratedChapter = {
  chapterNum: number;
  title: string;
  corePurpose: string;
  plotPoints: string[];
  keyCharacters: string[];
  emotionalArc: string;
  endHook: string;
  connectionToPrev: string;
  connectionToNext: string;
  mustInclude: string[];
  wordCountGuide: string;
};

type StoredOutlineChapter = {
  chapterNum?: number;
  title?: string;
  summary?: string;
  plotSummary?: string;
  corePurpose?: string;
  plotPoints?: string[];
};

function getProjectBibleDbPath(projectId: string) {
  return path.join(getProjectKnowledgeDir(projectId), "bible.sqlite");
}

function readProjectBible(projectId: string) {
  const dbPath = getProjectBibleDbPath(projectId);
  if (!fs.existsSync(dbPath)) {
    return { characters: [] as BibleCharacterRow[], globalRules: [] as GlobalRuleRow[], worldSettings: [] as WorldSettingRow[] };
  }

  const db = new Database(dbPath, { readonly: true });
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const names = new Set(tables.map((t) => t.name));

    const characters = names.has("characters")
      ? (db.prepare("SELECT * FROM characters").all() as BibleCharacterRow[])
      : ([] as BibleCharacterRow[]);

    const globalRules = names.has("global_rules")
      ? (db.prepare("SELECT * FROM global_rules ORDER BY priority DESC").all() as GlobalRuleRow[])
      : ([] as GlobalRuleRow[]);

    const worldSettings = names.has("world_settings")
      ? (db.prepare("SELECT * FROM world_settings ORDER BY createdAt DESC").all() as WorldSettingRow[])
      : ([] as WorldSettingRow[]);

    return { characters, globalRules, worldSettings };
  } finally {
    db.close();
  }
}

function formatSelectedCharacters(all: BibleCharacterRow[], selectedNames: string[]) {
  const selected = selectedNames.length ? all.filter((c) => c.name && selectedNames.includes(c.name)) : [];
  const list = selected.length ? selected : all.slice(0, 8);

  if (!list.length) return "（无角色数据）";

  return list
    .map((c) => {
      return [
        `【${c.name || "未命名"}】`,
        c.role ? `- 身份：${c.role}` : "",
        c.aliases ? `- 别名：${c.aliases}` : "",
        c.appearance ? `- 外貌：${c.appearance}` : "",
        c.personality ? `- 性格：${c.personality}` : "",
        c.speechStyle ? `- 语言风格：${c.speechStyle}` : "",
        c.behaviorRules ? `- 行为铁律：${c.behaviorRules}` : "",
        c.growthArc ? `- 成长弧光：${c.growthArc}` : "",
        c.background ? `- 背景：${c.background}` : "",
        c.currentStatus ? `- 当前状态：${c.currentStatus}` : "",
        c.sampleDialogue ? `- 典型对话：${c.sampleDialogue}` : "",
        c.keyEvents ? `- 关键事件：${c.keyEvents}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function formatGlobalRules(rules: GlobalRuleRow[]) {
  if (!rules.length) return "（无全局规则）";
  return rules
    .map((r, idx) => {
      const title = r.title || `规则${idx + 1}`;
      const pr = typeof r.priority === "number" ? `（priority=${r.priority}）` : "";
      return `【${title}${pr}】\n${r.content || ""}`.trim();
    })
    .join("\n\n");
}

function formatWorldSettings(items: WorldSettingRow[]) {
  if (!items.length) return "（无世界设定）";
  return items
    .map((s) => {
      return [
        `【${s.name || "未命名"}】`,
        s.category ? `- 类别：${s.category}` : "",
        s.volume ? `- 卷册：${s.volume}` : "",
        s.description ? `- 描述：${s.description}` : "",
        s.currentStatus ? `- 当前状态：${s.currentStatus}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function readChapterContent(projectId: string, chapterNum: number): { title: string; content: string } | null {
  const dir = getProjectChaptersDir(projectId);
  const fp = path.join(dir, `${chapterNum}.json`);
  if (!fs.existsSync(fp)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(fp, "utf-8")) as any;
    return { title: raw.title || `第${chapterNum}章`, content: raw.content || "" };
  } catch {
    return null;
  }
}

function getLastNChapterEndings(projectId: string, beforeChapter: number, n: number, takeChars = 2000) {
  const parts: string[] = [];
  for (let i = 1; i <= n; i++) {
    const chNum = beforeChapter - i;
    if (chNum <= 0) break;
    const ch = readChapterContent(projectId, chNum);
    if (!ch?.content) continue;
    parts.push(`【第${chNum}章 ${ch.title} 末尾摘录】\n${ch.content.slice(-takeChars)}`);
  }
  return parts.reverse().join("\n\n");
}

function getRecent5ChapterSummariesFromOutline(projectId: string, beforeChapter: number) {
  try {
    const outline = loadOutline(projectId) as any;
    const all = Array.isArray(outline?.volumes)
      ? outline.volumes.flatMap((v: any) => (Array.isArray(v.chapters) ? v.chapters : []))
      : [];

    const prev = all
      .filter((c: any) => typeof c?.chapterNum === "number" && c.chapterNum < beforeChapter)
      .sort((a: any, b: any) => b.chapterNum - a.chapterNum)
      .slice(0, 5)
      .reverse();

    if (!prev.length) return "（无前文摘要）";

    return prev
      .map((c: any) => {
        const sum = c.plotSummary || c.summary || "";
        return `第${c.chapterNum}章《${c.title || ""}》：${String(sum).slice(0, 300)}`;
      })
      .join("\n");
  } catch {
    return "（无前文摘要）";
  }
}

function getFirstSentence(text: string, maxLen = 120) {
  const normalized = String(text || "")
    .replace(/\s+/g, " ")
    .replace(/^[\-•\d.、\s]+/, "")
    .trim();

  if (!normalized) return "";

  const matched = normalized.match(/^(.+?[。！？!?；;])/);
  const firstSentence = matched?.[1] || normalized;
  return firstSentence.slice(0, maxLen).trim();
}

function getChapterOneLineSummary(chapter: StoredOutlineChapter) {
  const candidate = [
    chapter.corePurpose,
    chapter.plotSummary,
    chapter.summary,
    Array.isArray(chapter.plotPoints) ? chapter.plotPoints[0] : "",
  ]
    .map((item) => String(item || "").trim())
    .find(Boolean);

  return getFirstSentence(candidate || "") || "（无摘要）";
}

function getCompletedChaptersContextFromOutline(projectId: string, volumeNum: number, beforeChapter: number) {
  try {
    const outline = loadOutline(projectId) as any;
    const volume = Array.isArray(outline?.volumes)
      ? outline.volumes.find((v: any) => v?.volumeNum === volumeNum)
      : null;

    const chapters = Array.isArray(volume?.chapters)
      ? (volume.chapters as StoredOutlineChapter[])
          .filter((chapter) => typeof chapter.chapterNum === "number" && (chapter.chapterNum as number) < beforeChapter)
          .sort((a, b) => (a.chapterNum as number) - (b.chapterNum as number))
      : [];

    if (!chapters.length) {
      return "（本卷此前暂无已生成章节）";
    }

    return chapters
      .map((chapter) => {
        return `第${chapter.chapterNum}章《${chapter.title || ""}》：${getChapterOneLineSummary(chapter)}`;
      })
      .join("\n");
  } catch {
    return "（本卷此前暂无已生成章节）";
  }
}

function getOutlineModelConfig() {
  const model = process.env.OUTLINE_MODEL || process.env.DEFAULT_MODEL;
  const apiKey = process.env.OUTLINE_API_KEY || process.env.DEFAULT_API_KEY;
  const baseUrl = process.env.OUTLINE_BASE_URL || process.env.DEFAULT_BASE_URL;
  if (!model || !apiKey || !baseUrl) {
    throw new Error("Missing OUTLINE_* or DEFAULT_* env configuration");
  }
  return { model, apiKey, baseUrl };
}

function extractJsonArray(text: string) {
  // 尽量稳：找到第一个 '[' 与最后一个 ']' 之间的内容
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < 0 || end <= start) return null;
  return text.slice(start, end + 1);
}

function cleanJsonResponse(raw: string): string {
  // 去掉 markdown 代码块
  let cleaned = raw.replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '');

  // 清洗常见的中文引号/特殊字符
  cleaned = cleaned
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00a0/g, ' ')
    .trim();

  // 提取第一个 [ 或 { 到最后一个 ] 或 } 之间的内容
  const start = Math.min(
    cleaned.indexOf('[') === -1 ? Infinity : cleaned.indexOf('['),
    cleaned.indexOf('{') === -1 ? Infinity : cleaned.indexOf('{')
  );
  const endBracket = cleaned.lastIndexOf(']');
  const endBrace = cleaned.lastIndexOf('}');
  const end = Math.max(endBracket, endBrace);

  if (start !== Infinity && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  return cleaned;
}

function repairTruncatedJson(cleaned: string): string {
  const trimmedStart = cleaned.trimStart();
  const trimmedEnd = cleaned.trimEnd();

  if (!trimmedStart.startsWith("[") || trimmedEnd.endsWith("]")) {
    return cleaned;
  }

  const lastCompleteObj = cleaned.lastIndexOf("}");
  if (lastCompleteObj === -1) {
    return cleaned;
  }

  let repaired = cleaned.slice(0, lastCompleteObj + 1);
  repaired = repaired.replace(/,\s*$/, "");
  repaired += "]";
  return repaired;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  let body: GenerateOutlineRequest;
  try {
    body = (await request.json()) as GenerateOutlineRequest;
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const { volumeNum, volumeTitle, startChapter, endChapter, volumeSummary, characters, constraints } = body;

  if (!volumeNum || !volumeTitle || !startChapter || !endChapter || !volumeSummary) {
    return NextResponse.json(
      { error: "缺少必要参数：volumeNum, volumeTitle, startChapter, endChapter, volumeSummary" },
      { status: 400 }
    );
  }

  const { characters: bibleChars, globalRules, worldSettings } = readProjectBible(projectId);
  const roleBibleText = formatSelectedCharacters(bibleChars, characters || []);
  const globalRulesText = formatGlobalRules(globalRules);
  const worldSettingsText = formatWorldSettings(worldSettings);
  const prevSummaries = getRecent5ChapterSummariesFromOutline(projectId, startChapter);
  const completedChaptersContext = getCompletedChaptersContextFromOutline(projectId, volumeNum, startChapter);
  const endings = getLastNChapterEndings(projectId, startChapter, 3, 2000);

  // StoryGuard 约束上下文
  let storyGuardSection = '';
  try {
    storyGuardSection = await assembleStoryGuardContext(projectId, volumeNum, startChapter, endChapter);
  } catch (e) {
    console.warn('[generate-outline] StoryGuard 上下文获取失败，跳过:', e);
  }

  const systemPrompt = `你是一位顶级网文策划编辑，擅长设计高留存率、强爽点的章节细纲。
${storyGuardSection ? `\n${storyGuardSection}\n\n---以下是知识库参考信息---\n` : ''}

【你的任务】
根据提供的全书背景、角色信息、前文摘要，为本卷生成详细的分章细纲。

【角色圣经】
${roleBibleText}

【全局规则】
${globalRulesText}

【世界设定】
${worldSettingsText}

【前文摘要（最近5章）】
${prevSummaries}

【已完成章节（请勿重复这些内容，从这些章节之后继续推进剧情）】
${completedChaptersContext}

【前文情绪衔接（最近3章末尾）】
${endings || "（无章节末尾文本）"}

【本卷信息】
- 卷号：${volumeNum}
- 卷名：${volumeTitle}
- 章节范围：第${startChapter}章 - 第${endChapter}章
- 本卷概要：${volumeSummary}
- 主要角色：${(characters || []).join("、")}
- 特殊约束：${constraints || "无"}

【当前生成任务】
现在请生成第${startChapter}-${endChapter}章，剧情必须在上述【已完成章节】的基础上继续向前推进，不得重复已有事件。

【输出要求】
生成JSON数组，每个元素代表一章，格式：
{
  "chapterNum": 172,
  "title": "章节标题。【标题风格铁律】：7个章节的标题字数必须各不相同，严禁出现两个标题字数一样的情况。参考以下真实标题的多样性：'史上最贵集结令'(7字)、'光，来了！'(4字带标点)、'铁桶里的锈'(5字)、'一双手，一座山'(6字带逗号)、'你已经不需要我了'(8字)、'以孤为王'(4字)、'当上帝掷下骰子'(7字)、'点火一次，半亿成灰'(8字带逗号)。要求：有的用隐喻(如'铁桶里的锈')，有的用感叹(如'光，来了！')，有的用陈述(如'你已经不需要我了')，有的用对仗(如'一双手，一座山')。绝对禁止全部使用'四字+逗号+四字'的格式。",
  "corePurpose": "本章核心功能（1-2句话，说明这章在全卷中的叙事作用）",
  "plotPoints": [
    "情节点1：具体描述（含角色动作、对话要点、场景）",
    "情节点2：...",
    "情节点3：..."
  ],
  "keyCharacters": ["李弈", "魏莱"],
  "emotionalArc": "情绪弧线描述（从什么情绪到什么情绪）",
  "endHook": "章末钩子。这是写作模型被强制要求放在章节最后500字内的精确叙事内容。因此endHook必须是一个具体的、可直接写入正文的场景动作或角色台词，绝对不能是抽象的叙事指导。正确示例：'秦刃站在地铁站看着手机上Mirror这个词，抬头看向低头盯着手机的人流——镜无处不在。' 错误示例：'留下关于Mirror的悬念'、'为下一章埋下伏笔'",
  "connectionToPrev": "与上一章的衔接点",
  "connectionToNext": "为下一章埋的线",
  "mustInclude": ["必须出现的关键元素"],
  "wordCountGuide": "建议字数（2500-3500）"
}

【质量要求】
1. 每章必须有明确的、不可替代的叙事功能，不允许"过渡章"或"水章"
2. 每5章必须有一个大高潮节点
3. 每章结尾必须有具体的悬念钩子
4. 角色行为必须符合角色圣经中的行为铁律
5. 情节之间必须有因果链，前章的钩子必须在后续章节回收
6. 保持番茄网文的快节奏：每章至少一个小爽点或情感冲击点
7. 对话风格简洁有力，单段对话不超过3行

【重要规则】
- 已完成章节中出现过的事件不得再次出现
- 每章必须推进新的剧情进展
- 如果大纲中的某个事件已在前面章节中完成，直接跳过进入下一个事件
- 不得重新书写主角初次发现异常、被裁、求职受挫、首次接触案件等已经在已完成章节中发生过的内容，除非是作为一句话回顾背景，且不能再次作为本章主体事件

只输出JSON数组，不要任何其他文字。`;

  const { model, apiKey, baseUrl } = getOutlineModelConfig();
  const client = new OpenAI({ apiKey, baseURL: baseUrl });

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0.7,
    max_tokens: 8000,
  });

  const rawContent = completion.choices[0]?.message?.content || "";
  console.log('AI raw response:', rawContent);

  const cleanedContent = cleanJsonResponse(rawContent);
  const repairedContent = repairTruncatedJson(cleanedContent);
  console.log('AI repaired response:', repairedContent);
  const jsonText = extractJsonArray(repairedContent) || repairedContent;
  if (!jsonText) {
    return NextResponse.json(
      { error: "AI返回内容未包含JSON数组", raw: rawContent.slice(0, 4000) },
      { status: 500 }
    );
  }

  let chapters: GeneratedChapter[] = [];
  try {
    chapters = JSON.parse(jsonText) as GeneratedChapter[];
  } catch (e) {
    console.error('AI JSON parse failed. cleaned jsonText:', jsonText);
    return NextResponse.json(
      { error: "解析AI JSON失败", raw: jsonText.slice(0, 4000) },
      { status: 500 }
    );
  }

  if (!Array.isArray(chapters) || chapters.length === 0) {
    return NextResponse.json({ error: "生成的章节细纲为空" }, { status: 500 });
  }

  // 兜底：确保章节号在范围内且连续（不强改，只过滤明显错误）
  const filtered = chapters.filter((c) => typeof c?.chapterNum === "number");
  return NextResponse.json({ success: true, chapters: filtered });
}
