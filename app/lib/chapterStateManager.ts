import fs from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';
import { getProjectDataPath } from './storage/dataRoot';
import { getGenderLabel } from './genderRules';

export interface CharacterState {
  name: string;
  currentLocation: string;
  knownInformation: string[];
  relationshipUpdates: string[];
  emotionalState: string;
}

export interface ChapterState {
  chapterNo: number;
  timestamp: string;
  characters: CharacterState[];
  unresolvedClues: string[];
  resolvedClues: string[];
  keyItemLocations: Record<string, string>;
}

function createFallbackState(chapterNo: number): ChapterState {
  return {
    chapterNo,
    timestamp: new Date().toISOString(),
    characters: [],
    unresolvedClues: [],
    resolvedClues: [],
    keyItemLocations: {},
  };
}

function normalizeCharacterState(input: any): CharacterState {
  return {
    name: typeof input?.name === 'string' && input.name.trim() ? input.name.trim() : '未明确提及',
    currentLocation:
      typeof input?.currentLocation === 'string' && input.currentLocation.trim()
        ? input.currentLocation.trim()
        : '未明确提及',
    knownInformation: Array.isArray(input?.knownInformation)
      ? input.knownInformation.map((item: unknown) => String(item)).filter(Boolean)
      : ['未明确提及'],
    relationshipUpdates: Array.isArray(input?.relationshipUpdates)
      ? input.relationshipUpdates.map((item: unknown) => String(item)).filter(Boolean)
      : ['未明确提及'],
    emotionalState:
      typeof input?.emotionalState === 'string' && input.emotionalState.trim()
        ? input.emotionalState.trim()
        : '未明确提及',
  };
}

function normalizeChapterState(chapterNo: number, parsed: any): ChapterState {
  return {
    chapterNo: typeof parsed?.chapterNo === 'number' ? parsed.chapterNo : chapterNo,
    timestamp:
      typeof parsed?.timestamp === 'string' && parsed.timestamp.trim()
        ? parsed.timestamp
        : new Date().toISOString(),
    characters: Array.isArray(parsed?.characters)
      ? parsed.characters.map(normalizeCharacterState)
      : [],
    unresolvedClues: Array.isArray(parsed?.unresolvedClues)
      ? parsed.unresolvedClues.map((item: unknown) => String(item)).filter(Boolean)
      : [],
    resolvedClues: Array.isArray(parsed?.resolvedClues)
      ? parsed.resolvedClues.map((item: unknown) => String(item)).filter(Boolean)
      : [],
    keyItemLocations:
      parsed?.keyItemLocations && typeof parsed.keyItemLocations === 'object' && !Array.isArray(parsed.keyItemLocations)
        ? Object.fromEntries(
            Object.entries(parsed.keyItemLocations).map(([key, value]) => [String(key), String(value)])
          )
        : {},
  };
}

function extractJsonBlock(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

export async function extractChapterState(
  chapterNo: number,
  manuscriptText: string,
  outlineContent: string,
  modelCall: (prompt: string) => Promise<string>
): Promise<ChapterState> {
  const prompt = `你是一个小说状态追踪器。根据以下章节正文和细纲，提取本章结束时的世界状态。

【章节正文】
${manuscriptText}

【章节细纲】
${outlineContent}

请严格按以下 JSON 格式输出，不要添加任何其他文字：
{
  "chapterNo": <章节号>,
  "characters": [
    {
      "name": "角色名",
      "currentLocation": "章末时该角色所在的具体地点",
      "knownInformation": ["该角色在本章结束时已经掌握的所有关键信息"],
      "relationshipUpdates": ["本章中该角色与其他角色之间发生的关系变化"],
      "emotionalState": "本章结束时该角色的情绪状态"
    }
  ],
  "unresolvedClues": ["本章提出但未解答的悬念或线索"],
  "resolvedClues": ["本章解决或回答的之前遗留的线索"],
  "keyItemLocations": {"物品名": "当前持有者或所在位置"}
}

注意：
1. 只提取正文中实际出场的角色
2. currentLocation 必须基于正文最后一次提到该角色时的位置
3. knownInformation 是累积的——包含之前章节已知的加上本章新获取的
4. 如果正文未明确某个字段，填"未明确提及"`;

  try {
    const raw = await modelCall(prompt);
    try {
      return normalizeChapterState(chapterNo, JSON.parse(raw));
    } catch {
      const jsonBlock = extractJsonBlock(raw);
      if (jsonBlock) {
        return normalizeChapterState(chapterNo, JSON.parse(jsonBlock));
      }
      throw new Error('未找到可解析 JSON');
    }
  } catch (error) {
    console.warn('[chapterStateManager] 章节状态提取失败，使用空状态兜底:', error);
    return createFallbackState(chapterNo);
  }
}

export function saveChapterState(projectId: string, state: ChapterState): void {
  const filePath = getProjectDataPath(projectId, 'knowledge', 'chapterStates.json');
  const dirPath = path.dirname(filePath);
  fs.mkdirSync(dirPath, { recursive: true });

  let existing: ChapterState[] = [];
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existing = parsed;
      }
    } catch (error) {
      console.warn('[chapterStateManager] 读取 chapterStates.json 失败，将重建文件:', error);
    }
  }

  const normalizedState = normalizeChapterState(state.chapterNo, {
    ...state,
    timestamp: state.timestamp || new Date().toISOString(),
  });
  const index = existing.findIndex((item) => item.chapterNo === normalizedState.chapterNo);
  if (index >= 0) {
    existing[index] = normalizedState;
  } else {
    existing.push(normalizedState);
  }

  existing.sort((a, b) => a.chapterNo - b.chapterNo);
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
}

export function loadLatestStates(
  projectId: string,
  currentChapterNo: number,
  count: number = 3
): CharacterState[] {
  const filePath = getProjectDataPath(projectId, 'knowledge', 'chapterStates.json');
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const recentStates = parsed
      .filter((item: any) => typeof item?.chapterNo === 'number' && item.chapterNo < currentChapterNo)
      .sort((a: any, b: any) => b.chapterNo - a.chapterNo)
      .slice(0, count)
      .sort((a: any, b: any) => a.chapterNo - b.chapterNo);

    const merged = new Map<string, CharacterState>();
    for (const chapterState of recentStates) {
      const characters = Array.isArray(chapterState?.characters) ? chapterState.characters : [];
      for (const character of characters) {
        const normalized = normalizeCharacterState(character);
        merged.set(normalized.name, normalized);
      }
    }

    return Array.from(merged.values());
  } catch (error) {
    console.warn('[chapterStateManager] 加载角色状态失败:', error);
    return [];
  }
}

export function formatStateForInjection(states: CharacterState[]): string {
  const lines = ['【角色当前状态（基于前文，不可违背）】'];

  for (const state of states) {
    const genderLabel = getGenderLabel(state.name);
    const knownInformation = state.knownInformation?.length
      ? state.knownInformation.join('、')
      : '未明确提及';
    lines.push(
      `● ${state.name}${genderLabel ? `（${genderLabel}）` : ''} | 位置：${state.currentLocation || '未明确提及'} | 情绪：${state.emotionalState || '未明确提及'} | 已知信息：${knownInformation}`
    );
  }

  lines.push('（如果本章需要角色出现在与上述不同的地点，必须在正文中描写移动过程或使用远程通信方式）');
  return lines.join('\n');
}
