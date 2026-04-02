/**
 * 硬约束核验层
 *
 * 三大子功能：
 * A. 尾部硬切（正则，零成本）
 * B. 锚定文本存在性检查与修复
 * C. 禁止项检测与修复
 */

import { getPronounRule } from './genderRules';

// ─────────────────────────────────────────────
// A. 尾部硬切
// ─────────────────────────────────────────────

/**
 * 检测并删除网文固定尾部格式（下集预告、作者有话说、求好评等）。
 * 这是优先级最高、成本最低的修正，用纯正则实现。
 */
export function trimTailBoilerplate(manuscript: string): string {
  const tailPatterns = [
    /【?下[集章]预告】?/,
    /作者有话说/,
    /求.{0,6}好评/,
    /求.{0,6}追读/,
    /求.{0,6}月票/,
    /求.{0,6}推荐票/,
    /稳定[日周]更/,
    /不断更/,
    /准时更新/,
    /感谢.{0,10}(?:打赏|支持|订阅)/,
  ];

  let earliestCut = manuscript.length;

  for (const pattern of tailPatterns) {
    const globalPattern = new RegExp(pattern.source, "g");
    const matches = [...manuscript.matchAll(globalPattern)];
    if (matches.length === 0) continue;

    const lastMatch = matches[matches.length - 1];
    const matchStart = lastMatch.index ?? manuscript.length;

    // 向前回溯到该行的起始位置
    let lineStart = manuscript.lastIndexOf("\n", matchStart - 1);
    if (lineStart === -1) lineStart = 0;

    // 继续向前跳过连续空行
    while (lineStart > 0 && manuscript[lineStart - 1] === "\n") {
      lineStart--;
    }

    if (lineStart < earliestCut) {
      earliestCut = lineStart;
    }
  }

  if (earliestCut < manuscript.length) {
    return manuscript.slice(0, earliestCut).trimEnd();
  }
  return manuscript;
}

// ─────────────────────────────────────────────
// B. 锚定文本检查
// ─────────────────────────────────────────────

export interface AnchorItem {
  text: string;
  speaker?: string;
  position?: string;
}

export interface AnchorCheckResult {
  type: "ANCHOR_MISSING" | "ANCHOR_WRONG_POSITION";
  expected_text: string;
  speaker?: string;
  position?: string;
  best_match_ratio?: number;
  actual_position_ratio?: number;
  message?: string;
}

/**
 * 简单相似度（基于公共子串比例）——避免引入 difflib。
 */
function similarityRatio(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++;
  }
  return matches / longer.length;
}

/**
 * 检查每条锚定文本是否在正文中出现（精确匹配 + 模糊兜底）。
 * 返回缺失的锚定文本列表。
 */
export function checkAnchors(
  manuscript: string,
  anchors: AnchorItem[]
): AnchorCheckResult[] {
  const results: AnchorCheckResult[] = [];
  const manuscriptLength = manuscript.length;

  for (const anchor of anchors) {
    const cleanTarget = anchor.text.trim().replace(/^["""''【】]|["""''【】]$/g, "");

    // 精确匹配
    let foundIndex = manuscript.indexOf(cleanTarget);
    if (foundIndex === -1) {
      foundIndex = manuscript.indexOf(anchor.text.trim());
    }

    if (foundIndex !== -1) {
      // 内容存在，检查位置
      if (anchor.position === 'ending') {
        const positionRatio = foundIndex / manuscriptLength;
        if (positionRatio < 0.75) {
          results.push({
            type: "ANCHOR_WRONG_POSITION",
            expected_text: anchor.text,
            speaker: anchor.speaker,
            position: anchor.position,
            actual_position_ratio: positionRatio,
            best_match_ratio: 1.0,
            message: `endHook内容"${cleanTarget.substring(0, 40)}..."出现在正文${Math.round(positionRatio * 100)}%处，应在75%之后`
          });
        }
      }
      continue;
    }

    // 滑动窗口模糊匹配（保持原有逻辑）
    const windowSize = cleanTarget.length + 20;
    let bestRatio = 0;
    let bestIndex = -1;
    for (let i = 0; i <= Math.max(0, manuscript.length - cleanTarget.length + 20); i++) {
      const window = manuscript.slice(i, i + windowSize);
      const ratio = similarityRatio(cleanTarget, window);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestIndex = i;
      }
    }

    if (bestRatio >= 0.9) {
      // 模糊匹配成功，也需要检查位置
      if (anchor.position === 'ending' && bestIndex !== -1) {
        const positionRatio = bestIndex / manuscriptLength;
        if (positionRatio < 0.75) {
          results.push({
            type: "ANCHOR_WRONG_POSITION",
            expected_text: anchor.text,
            speaker: anchor.speaker,
            position: anchor.position,
            actual_position_ratio: positionRatio,
            best_match_ratio: bestRatio,
            message: `endHook内容"${cleanTarget.substring(0, 40)}..."出现在正文${Math.round(positionRatio * 100)}%处，应在75%之后`
          });
        }
      }
      // 模糊匹配成功且位置正确，不报告问题
    } else {
      // 匹配失败
      results.push({
        type: "ANCHOR_MISSING",
        expected_text: anchor.text,
        speaker: anchor.speaker,
        position: anchor.position,
        best_match_ratio: bestRatio,
      });
    }
  }

  return results;
}

// ─────────────────────────────────────────────
// C. 禁止项关键词提取（缓存）
// ─────────────────────────────────────────────

const keywordCache = new Map<string, string[]>();

/**
 * 从禁止规则中提取可能在正文出现的关键词。
 * 结果按规则文本缓存，避免重复调用 LLM。
 */
export async function extractKeywordsFromRule(
  rule: string,
  llmCall: (prompt: string) => Promise<string>
): Promise<string[]> {
  if (keywordCache.has(rule)) {
    return keywordCache.get(rule)!;
  }

  const prompt = `从以下禁止规则中提取所有可能在小说正文中出现的关键词和同义表述。
包括直接提到的词、同义词、关联词、常见变体。

禁止规则：${rule}

只返回 JSON 数组，例如：["华尔街", "灰衣人", "四大粮商"]
不要返回任何解释，只返回 JSON 数组。`;

  try {
    const raw = await llmCall(prompt);
    const match = raw.match(/\[[\s\S]*\]/);
    const keywords: string[] = match ? JSON.parse(match[0]) : [];
    keywordCache.set(rule, keywords);
    return keywords;
  } catch {
    keywordCache.set(rule, []);
    return [];
  }
}

// ─────────────────────────────────────────────
// C. 禁止项检测
// ─────────────────────────────────────────────

export interface ViolationItem {
  rule: string;
  evidence: string;
  severity: "严重" | "轻微";
}

export interface ForbiddenCheckResult {
  violations: ViolationItem[];
}

/**
 * 两层检测：
 * 第一层 — 关键词快速扫描（低成本）
 * 第二层 — LLM 语义确认（仅对命中的规则触发）
 */
export async function checkForbiddenRules(
  manuscript: string,
  forbiddenRules: string[],
  llmCall: (prompt: string) => Promise<string>
): Promise<ViolationItem[]> {
  const violations: ViolationItem[] = [];

  for (const rule of forbiddenRules) {
    const keywords = await extractKeywordsFromRule(rule, llmCall);
    const hits = keywords.filter((kw) => manuscript.includes(kw));

    if (hits.length === 0) continue;

    // 第二层：语义确认
    const confirmPrompt = `请判断以下小说正文是否违反了这条禁止规则。

【禁止规则】
${rule}

【触发关键词】
${hits.join("、")}

【小说正文（节选）】
${manuscript.slice(0, 3000)}

请严格按以下 JSON 格式返回（不要输出其他内容）：
{
  "verdict": "违反" 或 "未违反",
  "quoted_text": "引用正文中违反的具体段落（如未违反则为空字符串）",
  "severity": "严重" 或 "轻微"
}`;

    try {
      const raw = await llmCall(confirmPrompt);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) continue;
      const result = JSON.parse(match[0]);
      if (result.verdict === "违反") {
        violations.push({
          rule,
          evidence: result.quoted_text || "",
          severity: result.severity === "严重" ? "严重" : "轻微",
        });
      }
    } catch {
      // 解析失败时跳过该规则
    }
  }

  return violations;
}

// ─────────────────────────────────────────────
// 日志条目类型
// ─────────────────────────────────────────────

export interface ConstraintLogEntry {
  check: string;
  status: string;
  detail: string;
}

// ========== 扩展检测函数 ==========

/**
 * 扫描正文中出现的未授权角色
 */
export function checkUnauthorizedCharacters(
  manuscript: string,
  keyCharacters: string[],
  allKnownCharacters: string[]
): { name: string; count: number; hasDialogue: boolean; severity: 'hard' | 'soft' }[] {
  const violations: { name: string; count: number; hasDialogue: boolean; severity: 'hard' | 'soft' }[] = [];

  for (const charName of allKnownCharacters) {
    if (!charName || charName.length < 2) continue;
    if (keyCharacters.some((kc) => kc.includes(charName) || charName.includes(kc))) continue;

    const regex = new RegExp(charName, 'g');
    const matches = manuscript.match(regex);
    if (!matches) continue;

    const count = matches.length;

    const dialogueRegex = new RegExp(
      `${charName}[：:"""]|${charName}(?:说|道|问|喊|叫|笑道|冷笑|低声|轻声|大声|嘟囔|嘀咕|回答|反驳|补充|插嘴|开口|接话|吐槽)`,
      'g'
    );
    const hasDialogue = dialogueRegex.test(manuscript);

    violations.push({
      name: charName,
      count,
      hasDialogue,
      severity: hasDialogue ? 'hard' : 'soft'
    });
  }

  return violations;
}

/**
 * 检查正文字数是否达到下限
 */
export function checkWordCount(
  manuscript: string,
  suggestedWordCount: number,
  threshold: number = 0.80
): { pass: boolean; actual: number; minimum: number; ratio: number } {
  const cleanText = manuscript
    .replace(/【下集预告】[\s\S]*$/, '')
    .replace(/求五星好评[\s\S]*$/, '')
    .replace(/求追读[\s\S]*$/, '')
    .trim();

  const actual = cleanText.length;
  const minimum = Math.floor(suggestedWordCount * threshold);
  const ratio = actual / suggestedWordCount;

  return { pass: actual >= minimum, actual, minimum, ratio };
}

/**
 * 检测正文中的重复表达及跨章重复
 */
export function checkPatternRepetition(
  manuscript: string,
  patternKeywords: string[],
  previousChaptersText: string = ''
): { pattern: string; countInCurrent: number; foundInPrevious: boolean; suggestion: string }[] {
  if (!Array.isArray(patternKeywords)) patternKeywords = [];
  const results: { pattern: string; countInCurrent: number; foundInPrevious: boolean; suggestion: string }[] = [];

  for (const pattern of patternKeywords) {
    if (!pattern || pattern.length < 2) continue;

    const regex = new RegExp(pattern, 'g');
    const currentMatches = manuscript.match(regex);
    const countInCurrent = currentMatches ? currentMatches.length : 0;
    const foundInPrevious = previousChaptersText.length > 0 ? regex.test(previousChaptersText) : false;

    if (countInCurrent >= 2 || (countInCurrent >= 1 && foundInPrevious)) {
      results.push({
        pattern,
        countInCurrent,
        foundInPrevious,
        suggestion: countInCurrent >= 2
          ? `"${pattern}"在本章出现${countInCurrent}次，建议保留不超过1次`
          : `"${pattern}"在前文已出现过，本章再次使用会造成跨章重复`
      });
    }
  }

  return results;
}

export function checkGenderConsistency(
  manuscript: string,
  keyCharacters: string[]
): { character: string; expectedPronoun: string; wrongPronoun: string; count: number }[] {
  const results: { character: string; expectedPronoun: string; wrongPronoun: string; count: number }[] = [];
  const checkedCharacters = keyCharacters.filter((name) => !!getPronounRule(name));

  for (const character of checkedCharacters) {
    const rule = getPronounRule(character);
    if (!rule) continue;

    for (const wrongPronoun of rule.wrongPronouns) {
      const nearNamePattern = new RegExp(`${character}[，。！？；：、“”"'\\s]{0,12}${wrongPronoun}|${wrongPronoun}[，。！？；：、“”"'\\s]{0,12}${character}`, 'g');
      const quotedPattern = new RegExp(`(?:${character}).{0,20}[说想看盯望听问道喊叫答]?[，。！？；：、“”"'\\s]{0,6}${wrongPronoun}`, 'g');
      const matches = [
        ...(manuscript.match(nearNamePattern) || []),
        ...(manuscript.match(quotedPattern) || []),
      ];
      const count = matches.length;

      if (count > 0) {
        results.push({
          character,
          expectedPronoun: rule.expectedPronoun,
          wrongPronoun,
          count,
        });
      }
    }
  }

  return results;
}

// ========== 统一约束报告 ==========

export interface HardConstraintReport {
  anchorCheck: AnchorCheckResult[];
  unauthorizedCharacters: { name: string; count: number; hasDialogue: boolean; severity: 'hard' | 'soft' }[];
  wordCount: { pass: boolean; actual: number; minimum: number; ratio: number };
  patternRepetition: { pattern: string; countInCurrent: number; foundInPrevious: boolean; suggestion: string }[];
  genderViolations: { character: string; expectedPronoun: string; wrongPronoun: string; count: number }[];
  overallPass: boolean;
  summary: string;
}

export function runFullConstraintCheck(params: {
  manuscript: string;
  anchors: AnchorItem[];
  keyCharacters: string[];
  allKnownCharacters: string[];
  suggestedWordCount: number;
  patternKeywords: string[];
  previousChaptersText?: string;
}): HardConstraintReport {
  const anchorCheck = checkAnchors(params.manuscript, params.anchors);
  const unauthorizedCharacters = checkUnauthorizedCharacters(
    params.manuscript, params.keyCharacters, params.allKnownCharacters
  );
  const wordCount = checkWordCount(params.manuscript, params.suggestedWordCount);
  const safePatternKeywords = Array.isArray(params.patternKeywords) ? params.patternKeywords : [];
  const patternRepetition = checkPatternRepetition(
    params.manuscript, safePatternKeywords, params.previousChaptersText || ''
  );
  const genderViolations = checkGenderConsistency(params.manuscript, params.keyCharacters);

  const hardViolations: string[] = [];

  anchorCheck.forEach((a) => {
    if (a.type === 'ANCHOR_MISSING' || a.type === 'ANCHOR_WRONG_POSITION') {
      hardViolations.push(`endHook_${a.type}: ${a.message || ''}`);
    }
  });

  unauthorizedCharacters.filter((c) => c.severity === 'hard').forEach((c) => {
    hardViolations.push(`未授权角色"${c.name}"有对话(${c.count}次)`);
  });

  if (!wordCount.pass) {
    hardViolations.push(`字数不足:${wordCount.actual}/${wordCount.minimum}`);
  }

  genderViolations.filter((g) => g.count >= 2).forEach((g) => {
    hardViolations.push(`性别代词错误:${g.character}/${g.wrongPronoun}->${g.expectedPronoun}(${g.count}次)`);
  });

  const overallPass = hardViolations.length === 0;

  const parts: string[] = [];
  parts.push(`endHook:${anchorCheck.every((a) => a.type !== 'ANCHOR_MISSING' && a.type !== 'ANCHOR_WRONG_POSITION') ? '✓' : '✗'}`);
  const hardChars = unauthorizedCharacters.filter((c) => c.severity === 'hard');
  parts.push(`角色:${hardChars.length === 0 ? '✓' : '✗ ' + hardChars.map((c) => c.name).join(',')}`);
  parts.push(`性别:${genderViolations.filter((g) => g.count >= 2).length === 0 ? '✓' : '✗ ' + genderViolations.filter((g) => g.count >= 2).map((g) => `${g.character}:${g.wrongPronoun}`).join(',')}`);
  parts.push(`字数:${wordCount.pass ? '✓' : '✗'} ${wordCount.actual}/${params.suggestedWordCount}`);
  parts.push(`重复:${patternRepetition.length === 0 ? '✓' : '⚠ ' + patternRepetition.map((p) => p.pattern).join(',')}`);

  return {
    anchorCheck,
    unauthorizedCharacters,
    wordCount,
    patternRepetition,
    genderViolations,
    overallPass,
    summary: `[硬约束] ${overallPass ? 'PASS' : 'FAIL'} | ${parts.join(' | ')}`
  };
}
