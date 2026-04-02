import OpenAI from 'openai';
import fs from 'node:fs';
import { loadFacts, formatFactsAsConstraints } from './factsManager';
import { getProjectDataPath } from './storage/dataRoot';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export interface AuditIssue {
  chapter: number;
  severity: 'critical' | 'warning' | 'info';
  type: 'continuity' | 'version_regression' | 'redundant_reveal' | 'pattern_repetition' | 'logic_error' | 'endhook_overlap' | 'cross_chapter_leak' | 'unnecessary_character';
  description: string;
  violatedFact?: string;
  suggestion: string;
}

export interface AuditReport {
  passed: boolean;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  issues: AuditIssue[];
  checkedChapters: number[];
  timestamp: string;
}

// ─── JSON 解析保护（三层防御） ─────────────────────────────────────────────────

export function safeParseAuditJSON(raw: string): any {
  // 第一层：trim + 剥离 markdown 代码块标记
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.trim();

  // 第二层：直接 JSON.parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // 第三层：正则提取第一个 {...} 块
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ─── 获取审核模型配置 ─────────────────────────────────────────────────────────

function getReviewerModelConfig(): { model: string; apiKey: string; baseUrl: string } {
  const model = process.env.REVIEWER_MODEL || process.env.DEFAULT_MODEL;
  const apiKey = process.env.REVIEWER_API_KEY || process.env.DEFAULT_API_KEY;
  const baseUrl = process.env.REVIEWER_BASE_URL || process.env.DEFAULT_BASE_URL;

  if (!model || !apiKey || !baseUrl) {
    throw new Error('Missing REVIEWER model configuration. Check .env.local');
  }
  return { model, apiKey, baseUrl };
}

// ─── 分批常量 ────────────────────────────────────────────────────────────────

const AUDIT_BATCH_SIZE = 10;

// ─── 单批审计 helper ──────────────────────────────────────────────────────────

async function auditSingleBatch(
  batch: Array<{ chapterNumber: number; title: string; rawContent: string }>,
  factsConstraintText: string,
  existingChaptersSummary: string,
  client: OpenAI,
  model: string,
): Promise<{ passed: boolean; issues: AuditIssue[] } | null> {
  const chaptersText = batch
    .map(ch => `第${ch.chapterNumber}章《${ch.title}》\n${ch.rawContent}`)
    .join('\n\n---\n\n');

  const auditPrompt = `你是一位资深网文编辑，负责审查章节细纲的叙事一致性。

以下是本书已确立的事实（绝对不可违反）：
${factsConstraintText}

以下是本卷已有章节（用于对比是否存在雷同模式）：
${existingChaptersSummary}

以下是待审查的章节细纲：
${chaptersText}

请逐章检查以下问题：
1. 是否有已退出/死亡角色重新出场（对照角色状态清单）
2. 是否有技术版本/能力等级倒退（对照技术线版本表）
3. 是否有已揭示的信息被重新当作伏笔（对照已揭示信息清单）
4. 是否有与同卷其他章节雷同的叙事模式（如连续多章都是"入侵-反击-升级"）
5. 是否有明显的逻辑错误
6. 是否有某章的endHook与下一章的第一条plotPoint高度重复或雷同（endHook应制造悬念而非直接剧透下章开头）
7. 是否有某章的plotPoints中包含了前一章endHook已经揭示过的信息（同一信息不应跨章重复呈现）
8. 每章的keyCharacters是否精简——是否有角色被列入keyCharacters但在该章plotPoints中完全没有实质戏份

输出要求：只输出纯JSON，不要输出markdown代码块标记，不要输出任何解释文字。
JSON格式：
{"passed":true或false,"issues":[{"chapter":数字,"severity":"critical或warning或info","type":"continuity或version_regression或redundant_reveal或pattern_repetition或logic_error或endhook_overlap或cross_chapter_leak或unnecessary_character","description":"问题描述","violatedFact":"对应的事实（如有）","suggestion":"修复建议"}]}

如果没有发现任何问题，输出：{"passed":true,"issues":[]}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: auditPrompt }],
    temperature: 0.2,
    max_tokens: 4000,
  });

  const raw = completion.choices[0]?.message?.content || '';
  return safeParseAuditJSON(raw);
}

// ─── 核心审计函数 ────────────────────────────────────────────────────────────

export async function auditOutlineChapters(
  projectId: string,
  chapters: Array<{ chapterNumber: number; title: string; rawContent: string }>,
  options?: { model?: string }
): Promise<AuditReport> {
  const checkedChapters = chapters.map(c => c.chapterNumber);
  const timestamp = new Date().toISOString();

  // 1. 加载 facts
  const facts = await loadFacts(projectId);
  if (!facts) {
    console.warn('[postGenValidator] facts.json 不存在，跳过审计');
    return {
      passed: true,
      totalIssues: 0,
      criticalCount: 0,
      warningCount: 0,
      issues: [],
      checkedChapters,
      timestamp,
    };
  }

  // 2. 格式化约束文本（所有批次共用）
  const factsConstraintText = await formatFactsAsConstraints(projectId);

  // 3. 读取同卷已有章节用于套路对比（所有批次共用）
  let existingChaptersSummary = '（无已有章节数据）';
  try {
    const outlinePath = getProjectDataPath(projectId, 'knowledge', 'outline.json');
    if (fs.existsSync(outlinePath)) {
      const outlineData = JSON.parse(fs.readFileSync(outlinePath, 'utf-8'));
      const targetNums = new Set(checkedChapters);
      const existingLines: string[] = [];

      for (const vol of outlineData.volumes || []) {
        for (const ch of vol.chapters || []) {
          if (!targetNums.has(ch.chapterNum) && ch.rawContent) {
            existingLines.push(`第${ch.chapterNum}章 ${ch.title}：${ch.rawContent.slice(0, 100)}`);
          }
        }
      }
      if (existingLines.length > 0) {
        existingChaptersSummary = existingLines.slice(-20).join('\n');
      }
    }
  } catch (e) {
    console.warn('[postGenValidator] 读取已有章节失败:', e);
  }

  // 4. 初始化模型客户端
  const { model, apiKey, baseUrl } = getReviewerModelConfig();
  const client = new OpenAI({ apiKey, baseURL: baseUrl });
  const effectiveModel = options?.model || model;

  // 5. 拆分批次（≤10章时单批执行，保持向后兼容）
  const batches: Array<typeof chapters> = [];
  for (let i = 0; i < chapters.length; i += AUDIT_BATCH_SIZE) {
    batches.push(chapters.slice(i, i + AUDIT_BATCH_SIZE));
  }

  const allIssues: AuditIssue[] = [];
  let allPassed = true;
  let lastTimestamp = timestamp;

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    // 批次间延迟 1 秒，避免 API 限流（第一批不等待）
    if (batchIdx > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const batch = batches[batchIdx];
    const batchFirst = batch[0].chapterNumber;
    const batchLast = batch[batch.length - 1].chapterNumber;
    const batchLabel = batches.length > 1 ? `第${batchFirst}-${batchLast}章` : '本批';

    try {
      const parsed = await auditSingleBatch(
        batch,
        factsConstraintText,
        existingChaptersSummary,
        client,
        effectiveModel,
      );

      lastTimestamp = new Date().toISOString();

      if (!parsed) {
        // 单批解析失败，降级为 warning，继续其他批次
        console.warn(`[postGenValidator] ${batchLabel}审计结果解析失败`);
        allIssues.push({
          chapter: batchFirst,
          severity: 'warning',
          type: 'logic_error',
          description: `${batchLabel}审计解析失败，建议人工检查`,
          suggestion: '可尝试重新运行审计，或人工逐章检查',
        });
        allPassed = false;
      } else {
        const batchIssues: AuditIssue[] = Array.isArray(parsed.issues) ? parsed.issues : [];
        allIssues.push(...batchIssues);
        if (!(parsed.passed ?? (batchIssues.length === 0))) {
          allPassed = false;
        }
      }
    } catch (e) {
      console.error(`[postGenValidator] ${batchLabel}审计模型调用失败:`, e);
      allIssues.push({
        chapter: batchFirst,
        severity: 'warning',
        type: 'logic_error',
        description: `${batchLabel}审计模型调用失败：${e instanceof Error ? e.message : '未知错误'}`,
        suggestion: '检查 REVIEWER_MODEL 配置或网络连接',
      });
      allPassed = false;
    }
  }

  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const warningCount = allIssues.filter(i => i.severity === 'warning').length;

  return {
    passed: allPassed && allIssues.length === 0,
    totalIssues: allIssues.length,
    criticalCount,
    warningCount,
    issues: allIssues,
    checkedChapters,
    timestamp: lastTimestamp,
  };
}
