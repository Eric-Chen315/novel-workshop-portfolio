import fs from 'node:fs';
import OpenAI from 'openai';
import type { CharacterFact, TechLineFact, FactionFact, FactRegistry } from './factsManager';
import { loadFacts } from './factsManager';
import { getModelConfig } from './ai/modelRouter';
import { safeParseAuditJSON } from './postGenValidator';
import { getProjectDataPath } from './storage/dataRoot';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export interface ExtractedFacts {
  characters: Record<string, Partial<CharacterFact>>;
  techLines: Record<string, Partial<TechLineFact>>;
  factions: Record<string, Partial<FactionFact>>;
  majorEvents: Array<{
    event: string;
    volume: number;
    chapter: number;
    irreversible: boolean;
    affectedCharacters: string[];
  }>;
  revealedInfo: Array<{
    info: string;
    volume: number;
    chapter: number;
    note: string;
  }>;
}

export interface ExtractionReport {
  extractedFacts: ExtractedFacts;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
  sourceVolume: number;
  timestamp: string;
}

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

function getOutlinePath(projectId: string): string {
  return getProjectDataPath(projectId, 'knowledge', 'outline.json');
}

function getBiblePath(projectId: string): string {
  return getProjectDataPath(projectId, 'knowledge', 'bible.sqlite');
}

function getWorldbuildingPath(projectId: string): string {
  return getProjectDataPath(projectId, 'knowledge', 'worldbuilding.json');
}

// 从 outline.json 读取指定卷的所有章节 rawContent
function loadVolumeChapters(projectId: string, volumeNumber: number): string {
  try {
    const outlinePath = getOutlinePath(projectId);
    if (!fs.existsSync(outlinePath)) return '';

    const data = JSON.parse(fs.readFileSync(outlinePath, 'utf-8'));
    const volume = data.volumes?.find((v: { volumeNum: number }) => v.volumeNum === volumeNumber);
    
    if (!volume || !volume.chapters) return '';

    const chapters = volume.chapters
      .sort((a: { chapterNum: number }, b: { chapterNum: number }) => a.chapterNum - b.chapterNum)
      .map((ch: { chapterNum: number; title: string; rawContent?: string }) => {
        const content = ch.rawContent || '';
        return `第${ch.chapterNum}章《${ch.title}》\n${content}`;
      })
      .join('\n\n---\n\n');

    return chapters;
  } catch (e) {
    console.error('[factsExtractor] 读取卷章节失败:', e);
    return '';
  }
}

// 从 bible.sqlite 读取角色数据
function loadCharactersFromBible(projectId: string): string {
  try {
    const biblePath = getBiblePath(projectId);
    if (!fs.existsSync(biblePath)) return '';

    const Database = require('better-sqlite3');
    const db = new Database(biblePath, { readonly: true });
    
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    if (!tables.some(t => t.name === 'characters')) {
      db.close();
      return '';
    }

    const characters = db.prepare("SELECT * FROM characters ORDER BY createdAt").all();
    db.close();

    if (characters.length === 0) return '';

    const lines = ['角色数据库：'];
    for (const char of characters) {
      lines.push(`【${char.name}】`);
      if (char.role) lines.push(`  角色：${char.role}`);
      if (char.currentStatus) lines.push(`  当前状态：${char.currentStatus}`);
      if (char.behaviorRules) lines.push(`  行为铁律：${char.behaviorRules}`);
    }

    return lines.join('\n');
  } catch (e) {
    console.error('[factsExtractor] 读取角色圣经失败:', e);
    return '';
  }
}

// 从 worldbuilding.json 读取世界观设定
function loadWorldbuildingData(projectId: string): string {
  try {
    const wbPath = getWorldbuildingPath(projectId);
    if (!fs.existsSync(wbPath)) return '';

    const data = JSON.parse(fs.readFileSync(wbPath, 'utf-8'));
    const lines = ['世界观设定：'];

    const fields = [
      { key: 'worldBackground', label: '世界背景' },
      { key: 'powerSystem', label: '力量体系' },
      { key: 'factions', label: '势力分布' },
      { key: 'locations', label: '地点设定' },
      { key: 'items', label: '物品设定' },
      { key: 'rulesAndTaboos', label: '规则与禁忌' },
    ];

    for (const field of fields) {
      const value = data[field.key];
      if (value && typeof value === 'string' && value.trim()) {
        lines.push(`${field.label}：${value.slice(0, 200)}`);
      }
    }

    return lines.join('\n');
  } catch (e) {
    console.error('[factsExtractor] 读取世界观失败:', e);
    return '';
  }
}

// 生成现有事实摘要
function generateExistingFactsSummary(facts: FactRegistry | null): string {
  if (!facts) return '（无现有事实）';

  const lines: string[] = [];

  // 角色状态
  const charEntries = Object.entries(facts.characters);
  if (charEntries.length > 0) {
    lines.push('已记录角色状态：');
    for (const [name, char] of charEntries) {
      lines.push(`  ${name}：${char.status}（卷${char.lastSeenVolume}第${char.lastSeenChapter}章）`);
    }
  }

  // 技术线
  const techEntries = Object.entries(facts.techLines);
  if (techEntries.length > 0) {
    lines.push('已记录技术线：');
    for (const [name, tech] of techEntries) {
      lines.push(`  ${name}：${tech.currentVersion}（卷${tech.asOfVolume}第${tech.asOfChapter}章）`);
    }
  }

  // 不可逆事件
  if (facts.majorEvents.length > 0) {
    lines.push('已记录不可逆事件：');
    for (const evt of facts.majorEvents) {
      lines.push(`  卷${evt.volume}第${evt.chapter}章：${evt.event}`);
    }
  }

  // 已揭示信息
  if (facts.revealedInfo.length > 0) {
    lines.push('已记录揭示信息：');
    for (const info of facts.revealedInfo) {
      lines.push(`  卷${info.volume}第${info.chapter}章：${info.info}`);
    }
  }

  return lines.join('\n');
}

// ─── 核心提取函数 ────────────────────────────────────────────────────────────

export async function extractFactsFromVolume(
  projectId: string,
  volumeNumber: number,
  options?: { model?: string }
): Promise<ExtractionReport> {
  const timestamp = new Date().toISOString();

  // 1. 读取数据
  const chaptersContent = loadVolumeChapters(projectId, volumeNumber);
  if (!chaptersContent) {
    return {
      extractedFacts: {
        characters: {},
        techLines: {},
        factions: {},
        majorEvents: [],
        revealedInfo: [],
      },
      confidence: 'high',
      warnings: ['指定卷没有章节数据'],
      sourceVolume: volumeNumber,
      timestamp,
    };
  }

  const charactersFromBible = loadCharactersFromBible(projectId);
  const worldbuildingData = loadWorldbuildingData(projectId);
  const existingFacts = await loadFacts(projectId);
  const existingFactsSummary = generateExistingFactsSummary(existingFacts);

  // 2. 构建提取 prompt
  const extractionPrompt = `你是一位严谨的小说编辑助手，负责从章节细纲中提取已确立的事实。

## 现有事实（已确认，不要重复提取）
${existingFactsSummary}

## 本卷章节细纲（第${volumeNumber}卷）
${chaptersContent}

## 角色数据库
${charactersFromBible || '（无角色数据）'}

## 世界观设定
${worldbuildingData || '（无世界观数据）'}

## 任务

请从以上第${volumeNumber}卷的细纲中，提取所有**新增的**已确立事实。只提取本卷新产生的事实，不要重复现有事实。

提取规则：
1. **角色状态变化**：只提取本卷中状态发生变化的角色（退场、死亡、被捕、身份变化等）。未变化的角色不要提取。
2. **技术线进展**：只提取本卷中版本有更新的技术线。未变化的不要提取。
3. **新增不可逆事件**：只提取本卷中发生的、不可撤销的重大事件。
4. **新增已揭示信息**：只提取本卷中首次向读者揭示的重要信息，这些信息在后续卷中不应再被当作伏笔处理。
5. **不确定的事实**：如果某个事实无法从细纲中明确判断（如不确定角色是否永久退场），在 warnings 中标注，不要猜测。

输出严格 JSON 格式（不要输出 markdown 代码块标记，不要输出任何解释文字）：
{
  "characters": {
    "角色名": {
      "status": "active/eliminated/exited/imprisoned/unknown",
      "lastSeenVolume": 数字,
      "lastSeenChapter": 数字,
      "exitReason": "原因或null",
      "cannotAppear": true/false,
      "knownConditions": ["条件1"],
      "note": "说明"
    }
  },
  "techLines": {
    "技术名": {
      "currentVersion": "版本",
      "asOfVolume": 数字,
      "asOfChapter": 数字,
      "progression": ["新增版本记录"],
      "rule": "规则"
    }
  },
  "factions": {},
  "majorEvents": [
    {
      "event": "事件描述",
      "volume": 数字,
      "chapter": 数字,
      "irreversible": true/false,
      "affectedCharacters": ["角色名"]
    }
  ],
  "revealedInfo": [
    {
      "info": "信息描述",
      "volume": 数字,
      "chapter": 数字,
      "note": "说明"
    }
  ],
  "confidence": "high/medium/low",
  "warnings": ["不确定项1", "不确定项2"]
}

如果本卷没有任何新增事实，输出空结构：{"characters":{},"techLines":{},"factions":{},"majorEvents":[],"revealedInfo":[],"confidence":"high","warnings":[]}`;

  // 3. 调用 LLM
  try {
    const routedConfig = getModelConfig('事实提取');
    const model = options?.model || routedConfig.model;
    const apiKey = routedConfig.apiKey;
    const baseUrl = routedConfig.baseUrl;

    const client = new OpenAI({ apiKey, baseURL: baseUrl });
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: extractionPrompt }],
      temperature: 0.2,
      max_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content || '';

    // 4. 解析返回的 JSON（使用三层防御）
    const parsed = safeParseAuditJSON(raw);
    
    if (!parsed) {
      return {
        extractedFacts: {
          characters: {},
          techLines: {},
          factions: {},
          majorEvents: [],
          revealedInfo: [],
        },
        confidence: 'low',
        warnings: ['LLM 返回的 JSON 解析失败，请检查模型输出'],
        sourceVolume: volumeNumber,
        timestamp,
      };
    }

    // 5. 构建返回结果
    const extractedFacts: ExtractedFacts = {
      characters: parsed.characters || {},
      techLines: parsed.techLines || {},
      factions: parsed.factions || {},
      majorEvents: Array.isArray(parsed.majorEvents) ? parsed.majorEvents : [],
      revealedInfo: Array.isArray(parsed.revealedInfo) ? parsed.revealedInfo : [],
    };

    const confidence = parsed.confidence || 'medium';
    const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];

    return {
      extractedFacts,
      confidence: confidence as 'high' | 'medium' | 'low',
      warnings,
      sourceVolume: volumeNumber,
      timestamp,
    };
  } catch (e) {
    console.error('[factsExtractor] 提取失败:', e);
    return {
      extractedFacts: {
        characters: {},
        techLines: {},
        factions: {},
        majorEvents: [],
        revealedInfo: [],
      },
      confidence: 'low',
      warnings: [`提取失败：${e instanceof Error ? e.message : '未知错误'}`],
      sourceVolume: volumeNumber,
      timestamp,
    };
  }
}
