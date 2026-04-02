import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DATA_ROOT } from './dataRoot';

export function getBibleDbPath(projectId: string) {
  return path.join(DATA_ROOT, projectId, 'knowledge', 'bible.sqlite');
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const DDL = `
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  aliases TEXT DEFAULT '',
  gender TEXT DEFAULT '',
  role TEXT DEFAULT '',
  appearance TEXT DEFAULT '',
  background TEXT DEFAULT '',
  personality TEXT DEFAULT '',
  speechStyle TEXT DEFAULT '',
  behaviorRules TEXT DEFAULT '',
  growthArc TEXT DEFAULT '',
  currentStatus TEXT DEFAULT '',
  sampleDialogue TEXT DEFAULT '',
  keyEvents TEXT DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS world_settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  currentStatus TEXT DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
`;

/** 打开（并按需初始化）项目级 bible.sqlite，返回 Database 实例 */
export function openBibleDb(projectId: string) {
  const dbPath = getBibleDbPath(projectId);
  ensureDir(path.dirname(dbPath));
  const db = new Database(dbPath);
  try {
    db.prepare(`ALTER TABLE characters ADD COLUMN gender TEXT DEFAULT ''`).run();
  } catch (e) {
    // 列已存在，忽略
  }
  db.exec(DDL);
  try {
    db.prepare(`ALTER TABLE world_settings ADD COLUMN updatedAt TEXT`).run();
  } catch (e) {
    // 列已存在，忽略
  }
  return db;
}

export interface WorldSettingItem {
  name: string;
  /** 势力 | 地点 | 道具 | 其他 */
  category: string;
  description: string;
}

/**
 * 将世界观结构化条目写入 world_settings 表。
 * 同一 category 的旧数据会先清除再重写。
 */
export function saveWorldSettings(projectId: string, items: WorldSettingItem[]): void {
  if (items.length === 0) return;
  const db = openBibleDb(projectId);
  const now = new Date().toISOString();

  // 按 category 分组清除旧数据
  const categories = [...new Set(items.map((i) => i.category))];
  const placeholders = categories.map(() => '?').join(', ');
  db.prepare(`DELETE FROM world_settings WHERE category IN (${placeholders})`).run(...categories);

  const insert = db.prepare(
    `INSERT INTO world_settings (id, name, category, description, currentStatus, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, '', ?, ?)`
  );
  for (const item of items) {
    insert.run(randomUUID(), item.name, item.category, item.description, now, now);
  }

  db.close();
}
