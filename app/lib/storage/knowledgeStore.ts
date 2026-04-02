import fs from "node:fs";
import path from "node:path";

import { getProjectKnowledgeDir, ensureProjectScaffold } from "./projectStore";

export type CharacterProfile = {
  id: string;
  name: string;
  role: "主角" | "主要配角" | "次要配角" | "反派" | "路人";
  appearance?: string;
  personality?: string;
  speakingStyle?: string;
  backgroundStory?: string;
  currentStatus?: string;
  updatedAt: string;
};

export type CharacterRelation = {
  fromId: string;
  toId: string;
  type:
    | "盟友"
    | "敌对"
    | "暧昧"
    | "师徒"
    | "亲属"
    | "上下级"
    | "陌生";
  note?: string;
  updatedAt: string;
};

export type CharactersKnowledge = {
  characters: CharacterProfile[];
  relations: CharacterRelation[];
  updatedAt: string;
};

export type WorldbuildingKnowledge = {
  worldBackground: string;
  powerSystem: string;
  factions: string;
  locations: string;
  items: string;
  rulesAndTaboos: string;
  updatedAt: string;
  blocksUpdatedAt: Record<string, string>;
};

export type OutlineChapterStatus = "未开始" | "草稿中" | "已完成" | "需修改";

export type OutlineChapter = {
  id: string;
  chapterNum: number;
  title: string;
  summary: string;
  plotSummary?: string;
  rawContent?: string;
  corePurpose?: string;
  plotPoints?: string[];
  keyCharacters?: string[];
  emotionalArc?: string;
  endHook?: string;
  connectionToPrev?: string;
  mustInclude?: string[];
  connectionToNext?: string;
  suggestedWordCount?: number;
  wordCountGuide?: string;
  status: OutlineChapterStatus;
};

export type OutlineVolume = {
  id: string;
  volumeNum?: number;
  title: string;
  description?: string;
  summary?: string;
  chapters: OutlineChapter[];
};

export type OutlineKnowledge = {
  volumes: OutlineVolume[];
  updatedAt: string;
};

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function safeId(prefix: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoAny = globalThis.crypto as any;
  if (cryptoAny?.randomUUID) return `${prefix}_${cryptoAny.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readJson<T>(fp: string, fallback: T): T {
  if (!fs.existsSync(fp)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(fp: string, data: unknown) {
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), "utf-8");
}

export function getCharactersPath(projectId: string) {
  return path.join(getProjectKnowledgeDir(projectId), "characters.json");
}

export function getWorldbuildingPath(projectId: string) {
  return path.join(getProjectKnowledgeDir(projectId), "worldbuilding.json");
}

export function getOutlinePath(projectId: string) {
  return path.join(getProjectKnowledgeDir(projectId), "outline.json");
}

export function loadCharacters(projectId: string): CharactersKnowledge {
  ensureProjectScaffold(projectId);
  const fp = getCharactersPath(projectId);
  // 兼容你任务描述的“characters.json 直接是数组”的最初形态：
  const raw = readJson<unknown>(fp, []);
  if (Array.isArray(raw)) {
    const now = new Date().toISOString();
    return { characters: raw as CharacterProfile[], relations: [], updatedAt: now };
  }
  return raw as CharactersKnowledge;
}

export function saveCharacters(projectId: string, data: CharactersKnowledge) {
  ensureProjectScaffold(projectId);
  const next = {
    ...data,
    updatedAt: new Date().toISOString(),
  } satisfies CharactersKnowledge;
  writeJson(getCharactersPath(projectId), next);
  return next;
}

export function loadWorldbuilding(projectId: string): WorldbuildingKnowledge {
  ensureProjectScaffold(projectId);
  const now = new Date().toISOString();
  return readJson<WorldbuildingKnowledge>(getWorldbuildingPath(projectId), {
    worldBackground: "",
    powerSystem: "",
    factions: "",
    locations: "",
    items: "",
    rulesAndTaboos: "",
    updatedAt: now,
    blocksUpdatedAt: {
      worldBackground: now,
      powerSystem: now,
      factions: now,
      locations: now,
      items: now,
      rulesAndTaboos: now,
    },
  });
}

export function saveWorldbuilding(projectId: string, data: WorldbuildingKnowledge) {
  ensureProjectScaffold(projectId);
  const now = new Date().toISOString();
  const next: WorldbuildingKnowledge = {
    ...data,
    updatedAt: now,
    blocksUpdatedAt: data.blocksUpdatedAt || {},
  };
  writeJson(getWorldbuildingPath(projectId), next);
  return next;
}

export function loadOutline(projectId: string): OutlineKnowledge {
  ensureProjectScaffold(projectId);
  const now = new Date().toISOString();
  return readJson<OutlineKnowledge>(getOutlinePath(projectId), { volumes: [], updatedAt: now });
}

export function saveOutline(projectId: string, data: OutlineKnowledge) {
  ensureProjectScaffold(projectId);
  const next: OutlineKnowledge = { ...data, updatedAt: new Date().toISOString() };
  writeJson(getOutlinePath(projectId), next);
  return next;
}

export function newCharacterDraft(): CharacterProfile {
  const now = new Date().toISOString();
  return {
    id: safeId("c"),
    name: "",
    role: "主要配角",
    appearance: "",
    personality: "",
    speakingStyle: "",
    backgroundStory: "",
    currentStatus: "",
    updatedAt: now,
  };
}

export function newVolumeDraft(): OutlineVolume {
  return {
    id: safeId("v"),
    title: "",
    description: "",
    chapters: [],
  };
}

export function newOutlineChapterDraft(chapterNum: number): OutlineChapter {
  return {
    id: safeId("ch"),
    chapterNum,
    title: "",
    summary: "",
    rawContent: "",
    mustInclude: [],
    connectionToNext: "",
    status: "未开始",
  };
}
