import fs from 'node:fs';
import path from 'node:path';
import { ensureProjectScaffold, getProjectKnowledgeDir } from './storage/projectStore';

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export interface CharacterFact {
  status: 'active' | 'eliminated' | 'exited' | 'imprisoned' | 'unknown';
  lastSeenVolume: number;
  lastSeenChapter: number;
  exitReason: string | null;
  cannotAppear: boolean;
  knownConditions: string[];
  currentAbilities: string[];
  note: string;
}

export interface TechLineFact {
  currentVersion: string;
  asOfVolume: number;
  asOfChapter: number;
  progression: string[];
  rule: string;
}

export interface FactionFact {
  status: string;
  asOfVolume: number;
  note: string;
}

export interface MajorEvent {
  id: string;
  event: string;
  volume: number;
  chapter: number;
  irreversible: boolean;
  affectedCharacters: string[];
}

export interface RevealedInfo {
  id: string;
  info: string;
  volume: number;
  chapter: number;
  note: string;
}

export interface ConceptFact {
  chapter: number;
  category: string;
  definition: string;
  details: string[];
}

export interface KeyDataFact {
  chapter: number;
  category: string;
  details: string[];
}

export interface TimelineEntry {
  chapter: number;
  day: string;
  title: string;
  summary: string;
}

export interface FactRegistry {
  version: number;
  lastUpdated: string;
  updatedAt?: string;
  characters: Record<string, CharacterFact>;
  techLines: Record<string, TechLineFact>;
  factions: Record<string, FactionFact>;
  majorEvents: MajorEvent[];
  revealedInfo: RevealedInfo[];
  plotRules: string[];
  bannedExpressions?: string[];
  patternKeywords: Record<string, string>;
  concepts?: Record<string, ConceptFact>;
  keyData?: Record<string, KeyDataFact>;
  timeline?: TimelineEntry[];
}

// ─── 路径工具 ────────────────────────────────────────────────────────────────

function getFactsPath(projectId: string): string {
  return path.join(getProjectKnowledgeDir(projectId), 'facts.json');
}

function getMasterOutlinePath(projectId: string): string {
  return path.join(getProjectKnowledgeDir(projectId), 'master-outline.json');
}

// ─── 基础读写 ────────────────────────────────────────────────────────────────

export async function loadFacts(projectId: string): Promise<FactRegistry | null> {
  try {
    ensureProjectScaffold(projectId);
    const fp = getFactsPath(projectId);
    if (!fs.existsSync(fp)) return null;
    const raw = fs.readFileSync(fp, 'utf-8');
    return JSON.parse(raw) as FactRegistry;
  } catch (e) {
    console.warn('[factsManager] loadFacts 失败:', e);
    return null;
  }
}

export async function saveFacts(projectId: string, facts: FactRegistry): Promise<void> {
  ensureProjectScaffold(projectId);
  const fp = getFactsPath(projectId);
  const dir = path.dirname(fp);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const normalized: FactRegistry = {
    ...facts,
    characters: facts.characters ?? {},
    techLines: facts.techLines ?? {},
    factions: facts.factions ?? {},
    majorEvents: facts.majorEvents ?? [],
    revealedInfo: facts.revealedInfo ?? [],
    plotRules: facts.plotRules ?? [],
    bannedExpressions: facts.bannedExpressions ?? [],
    patternKeywords: facts.patternKeywords ?? {},
    concepts: facts.concepts ?? {},
    keyData: facts.keyData ?? {},
    timeline: facts.timeline ?? [],
    updatedAt: facts.updatedAt ?? facts.lastUpdated,
  };
  fs.writeFileSync(fp, JSON.stringify(normalized, null, 2), 'utf-8');
}

// ─── 增量合并 ────────────────────────────────────────────────────────────────

export async function mergeFacts(
  projectId: string,
  incoming: Partial<FactRegistry>
): Promise<FactRegistry> {
  const existing = await loadFacts(projectId);
  const base: FactRegistry = existing ?? {
    version: 0,
    lastUpdated: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    characters: {},
    techLines: {},
    factions: {},
    majorEvents: [],
    revealedInfo: [],
    plotRules: [],
    patternKeywords: {},
    bannedExpressions: [],
    concepts: {},
    keyData: {},
    timeline: [],
  };

  // characters: 同 key 用 incoming 覆盖
  if (incoming.characters) {
    for (const [k, v] of Object.entries(incoming.characters)) {
      base.characters[k] = v;
    }
  }

  // techLines: 同 key 用 incoming 覆盖
  if (incoming.techLines) {
    for (const [k, v] of Object.entries(incoming.techLines)) {
      base.techLines[k] = v;
    }
  }

  // factions: 同 key 用 incoming 覆盖
  if (incoming.factions) {
    for (const [k, v] of Object.entries(incoming.factions)) {
      base.factions[k] = v;
    }
  }

  // majorEvents: 按 id 去重
  if (incoming.majorEvents) {
    const existingIds = new Set(base.majorEvents.map(e => e.id));
    for (const evt of incoming.majorEvents) {
      if (!existingIds.has(evt.id)) {
        base.majorEvents.push(evt);
        existingIds.add(evt.id);
      }
    }
  }

  // revealedInfo: 按 id 去重
  if (incoming.revealedInfo) {
    const existingIds = new Set(base.revealedInfo.map(r => r.id));
    for (const info of incoming.revealedInfo) {
      if (!existingIds.has(info.id)) {
        base.revealedInfo.push(info);
        existingIds.add(info.id);
      }
    }
  }

  // plotRules: 保留原 + 追加新增(去重)
  if (incoming.plotRules) {
    const existingSet = new Set(base.plotRules);
    for (const rule of incoming.plotRules) {
      if (!existingSet.has(rule)) {
        base.plotRules.push(rule);
        existingSet.add(rule);
      }
    }
  }

  // patternKeywords: 同 key 覆盖
  if (incoming.patternKeywords) {
    for (const [k, v] of Object.entries(incoming.patternKeywords)) {
      base.patternKeywords[k] = v;
    }
  }

  // concepts: 同 key 用 incoming 覆盖
  if (incoming.concepts) {
    base.concepts = base.concepts ?? {};
    for (const [k, v] of Object.entries(incoming.concepts)) {
      base.concepts[k] = v;
    }
  }

  // keyData: 同 key 用 incoming 覆盖
  if (incoming.keyData) {
    base.keyData = base.keyData ?? {};
    for (const [k, v] of Object.entries(incoming.keyData)) {
      base.keyData[k] = v;
    }
  }

  // timeline: 追加并按 chapter/title 去重
  if (incoming.timeline) {
    base.timeline = base.timeline ?? [];
    const existingSet = new Set(base.timeline.map(item => `${item.chapter}::${item.title}`));
    for (const entry of incoming.timeline) {
      const key = `${entry.chapter}::${entry.title}`;
      if (!existingSet.has(key)) {
        base.timeline.push(entry);
        existingSet.add(key);
      }
    }
  }

  base.version += 1;
  base.lastUpdated = new Date().toISOString();
  base.updatedAt = base.lastUpdated;
  await saveFacts(projectId, base);
  return base;
}

// ─── 约束格式化 ──────────────────────────────────────────────────────────────

export async function formatFactsAsConstraints(projectId: string): Promise<string> {
  const facts = await loadFacts(projectId);
  if (!facts) return '';

  const lines: string[] = [];

  lines.push('╔═══════════════════════════════════════╗');
  lines.push('║ 【绝对事实 —— 违反任何一条即为致命错误】 ║');
  lines.push('╚═══════════════════════════════════════╝');
  lines.push('');

  // 角色状态（仅输出非 active 的角色 + cannotAppear 的角色）
  const constrainedChars = Object.entries(facts.characters)
    .filter(([, c]) => c.status !== 'active' || c.cannotAppear);

  if (constrainedChars.length > 0) {
    lines.push('■ 角色状态（不可违反）');
    for (const [name, c] of constrainedChars) {
      const statusLabel = c.cannotAppear ? '【禁止出场】' : `【${c.status}】`;
      lines.push(`  ${statusLabel} ${name}：${c.exitReason || c.note}`);
      if (c.knownConditions.length > 0) {
        lines.push(`    已知条件：${c.knownConditions.join('；')}`);
      }
    }
    lines.push('');
  }

  // active 角色的关键已知条件
  const activeWithConditions = Object.entries(facts.characters)
    .filter(([, c]) => c.status === 'active' && c.knownConditions.length > 0);

  if (activeWithConditions.length > 0) {
    lines.push('■ 活跃角色关键状态');
    for (const [name, c] of activeWithConditions) {
      lines.push(`  ${name}：${c.knownConditions.join('；')}`);
    }
    lines.push('');
  }

  // 技术线
  if (Object.keys(facts.techLines).length > 0) {
    lines.push('■ 技术线（版本只能递增）');
    for (const [name, t] of Object.entries(facts.techLines)) {
      lines.push(`  ${name}：当前${t.currentVersion}。${t.rule}`);
    }
    lines.push('');
  }

  // 不可逆事件
  const irreversible = facts.majorEvents.filter(e => e.irreversible);
  if (irreversible.length > 0) {
    lines.push('■ 不可逆事件');
    for (const evt of irreversible) {
      lines.push(`  卷${evt.volume}第${evt.chapter}章：${evt.event}`);
    }
    lines.push('');
  }

  // 已揭示信息
  if (facts.revealedInfo.length > 0) {
    lines.push('■ 已揭示信息（不可重复铺垫）');
    for (const r of facts.revealedInfo) {
      lines.push(`  卷${r.volume}第${r.chapter}章已揭示：${r.info}。${r.note}`);
    }
    lines.push('');
  }

  // 创作规则
  if (facts.plotRules.length > 0) {
    lines.push('■ 创作规则');
    facts.plotRules.forEach((rule, i) => {
      lines.push(`  ${i + 1}. ${rule}`);
    });
    lines.push('');
  }

  lines.push('╔═══════════════════════════════════════╗');
  lines.push('║       以上约束具有最高优先级           ║');
  lines.push('╚═══════════════════════════════════════╝');

  return lines.join('\n');
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

export async function getVolumeByChapter(
  projectId: string,
  chapterNumber: number
): Promise<number | null> {
  try {
    const fp = getMasterOutlinePath(projectId);
    if (!fs.existsSync(fp)) return null;
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    if (!data.volumes || !Array.isArray(data.volumes)) return null;

    for (const vol of data.volumes) {
      const range = vol.chapterRange as string | undefined;
      if (!range) continue;
      // chapterRange 格式如 "第100-153章" 或 "100-153章"
      const match = range.match(/(\d+)\s*[-–—]\s*(\d+)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const end = parseInt(match[2], 10);
        if (chapterNumber >= start && chapterNumber <= end) {
          return vol.volumeNum;
        }
      }
    }

    // 兜底：尝试从 outline.json 查找
    const outlinePath = path.join(getProjectKnowledgeDir(projectId), 'outline.json');
    if (fs.existsSync(outlinePath)) {
      const outlineData = JSON.parse(fs.readFileSync(outlinePath, 'utf-8'));
      for (const vol of outlineData.volumes || []) {
        const chapters = vol.chapters || [];
        if (chapters.some((c: { chapterNum: number }) => c.chapterNum === chapterNumber)) {
          return vol.volumeNum;
        }
      }
    }

    return null;
  } catch (e) {
    console.warn('[factsManager] getVolumeByChapter 失败:', e);
    return null;
  }
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 1.5);
}
