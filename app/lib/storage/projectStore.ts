import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { ProjectGenre, ProjectTargetWords, ProjectMeta } from '../types/project';
import { DATA_ROOT } from './dataRoot';

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function safeId() {
  // 兼容 node 18+：优先 randomUUID，否则降级
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoAny = globalThis.crypto as any;
  if (cryptoAny?.randomUUID) return cryptoAny.randomUUID();
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getProjectDir(projectId: string) {
  return path.join(DATA_ROOT, projectId);
}

export function getProjectMetaPath(projectId: string) {
  return path.join(getProjectDir(projectId), "meta.json");
}

export function getProjectKnowledgeDir(projectId: string) {
  return path.join(getProjectDir(projectId), "knowledge");
}

export function getProjectChaptersDir(projectId: string) {
  return path.join(getProjectDir(projectId), "chapters");
}

export function ensureProjectScaffold(projectId: string) {
  ensureDir(getProjectDir(projectId));
  ensureDir(getProjectKnowledgeDir(projectId));
  ensureDir(getProjectChaptersDir(projectId));
}

export function getProjects(): ProjectMeta[] {
  return listProjects();
}

export function listProjects(): ProjectMeta[] {
  ensureDir(DATA_ROOT);
  const dirs = fs
    .readdirSync(DATA_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const projects: ProjectMeta[] = [];
  for (const id of dirs) {
    const p = getProjectMetaPath(id);
    if (!fs.existsSync(p)) continue;
    try {
      const meta = JSON.parse(fs.readFileSync(p, "utf-8")) as ProjectMeta;
      if (!meta?.id) continue;
      projects.push(meta);
    } catch {
      // ignore broken project
    }
  }
  // 最近更新时间倒序
  projects.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return projects;
}

export function getProject(projectId: string): ProjectMeta | null {
  const p = getProjectMetaPath(projectId);
  if (!fs.existsSync(p)) return null;
  try {
    const meta = JSON.parse(fs.readFileSync(p, "utf-8")) as ProjectMeta;
    return meta;
  } catch {
    return null;
  }
}

export function createProject(input: {
  title: string;
  genre: ProjectGenre;
  targetWords: ProjectTargetWords;
  synopsis: string;
  styleDescription: string;
  tags?: string[];
  coverUrl?: string;
}): ProjectMeta {
  const id = safeId();
  const now = new Date().toISOString();
  const meta: ProjectMeta = {
    id,
    title: input.title.trim(),
    genre: input.genre,
    targetWords: input.targetWords,
    targetWordCount: input.targetWords.total,
    synopsis: input.synopsis.trim(),
    styleDescription: input.styleDescription.trim(),
    tags: (input.tags || []).map((t) => t.trim()).filter(Boolean),
    coverUrl: input.coverUrl,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  ensureProjectScaffold(id);
  fs.writeFileSync(getProjectMetaPath(id), JSON.stringify(meta, null, 2), "utf-8");

  // 初始化知识库文件（空）
  const knowledgeDir = getProjectKnowledgeDir(id);
  const initIfMissing = (name: string, content: unknown) => {
    const fp = path.join(knowledgeDir, name);
    if (!fs.existsSync(fp)) fs.writeFileSync(fp, JSON.stringify(content, null, 2), "utf-8");
  };
  initIfMissing("characters.json", []);
  initIfMissing("worldbuilding.json", {
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
  initIfMissing("outline.json", {
    volumes: [],
    updatedAt: now,
  });

  return meta;
}

export function updateProject(projectId: string, patch: Partial<Omit<ProjectMeta, "id" | "createdAt">>): ProjectMeta {
  const existing = getProject(projectId);
  if (!existing) throw new Error("Project not found");
  const next: ProjectMeta = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  ensureProjectScaffold(projectId);
  fs.writeFileSync(getProjectMetaPath(projectId), JSON.stringify(next, null, 2), "utf-8");
  return next;
}

export function archiveProject(projectId: string) {
  return updateProject(projectId, { status: "archived" });
}

export function unarchiveProject(projectId: string) {
  return updateProject(projectId, { status: "active" });
}

export function deleteProject(projectId: string) {
  const dir = getProjectDir(projectId);
  if (!fs.existsSync(dir)) return;

  fs.rmSync(dir, { recursive: true, force: true });

  if (!fs.existsSync(dir)) return;

  // Windows 环境下某些情况下 fs.rmSync 不会真正移除目录，这里增加系统级兜底删除。
  if (process.platform === "win32") {
    execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Remove-Item -LiteralPath '${dir.replace(/'/g, "''")}' -Recurse -Force`,
      ],
      { stdio: "pipe" },
    );
  }

  if (fs.existsSync(dir)) {
    throw new Error(`Project directory still exists after deletion: ${dir}`);
  }
}
