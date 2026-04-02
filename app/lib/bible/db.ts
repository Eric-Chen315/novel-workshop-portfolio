import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// 避免 TS 在 Next build 时解析不到 node:sqlite 的类型：这里不用静态 import。
// 运行时仍然使用 Node 24+ 内置的 node:sqlite。
type StatementSync = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (...params: any[]) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (...params: any[]) => unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  all: (...params: any[]) => unknown[];
};

type DatabaseSync = {
  exec: (sql: string) => void;
  prepare: (sql: string) => StatementSync;
};

function loadSqlite(): { DatabaseSync: new (filename: string) => DatabaseSync } {
  // 说明：在 Next/Turbopack 的服务端运行时，createRequire(import.meta.url)
  // 可能会被编译成传入「Url 类型」导致报错：
  // "Unsupported external type Url for commonjs reference"
  // 因此这里改为基于项目根目录的 package.json 来创建 require。
  const require = createRequire(path.join(process.cwd(), "package.json"));
  // require 调用不会触发 TS 的模块解析错误
  return require("node:sqlite") as { DatabaseSync: new (filename: string) => DatabaseSync };
}

/**
 * 使用 Node 22+ 内置的 node:sqlite，避免 sql.js wasm 在 Next/Turbopack 下的构建问题。
 *
 * 注意：node:sqlite 目前处于 Experimental，但对本项目本地 MVP 来说更稳定易用。
 */
let dbSingleton: DatabaseSync | null = null;

function getDbFilePath() {
  // 将 sqlite 文件放在项目根目录下 data/bible.sqlite，便于持久化
  return path.join(process.cwd(), "data", "bible.sqlite");
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age_appearance TEXT NOT NULL DEFAULT '',
  background TEXT NOT NULL DEFAULT '',
  personality TEXT NOT NULL DEFAULT '',
  speaking_style TEXT NOT NULL DEFAULT '',
  catchphrase TEXT NOT NULL DEFAULT '',
  current_location TEXT NOT NULL DEFAULT '',
  current_status TEXT NOT NULL DEFAULT '',
  default_inject INTEGER NOT NULL DEFAULT 0,
  locked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_name ON characters(name);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plotlines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rule TEXT NOT NULL DEFAULT '',
  trigger TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'untriggered',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deprecated (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export async function getDb() {
  if (dbSingleton) return dbSingleton;

  const filePath = getDbFilePath();
  ensureDir(path.dirname(filePath));

  // filePath 不存在时会自动创建
  const { DatabaseSync } = loadSqlite();
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(SCHEMA_SQL);

  // 兜底：确保李弈存在且默认注入且锁定不可取消
  const now = new Date().toISOString();
  db.prepare(
    `INSERT OR IGNORE INTO characters(id,name,default_inject,locked,created_at,updated_at)
     VALUES('li_yi','李弈',1,1,?,?);`
  ).run(now, now);
  db.prepare(`UPDATE characters SET default_inject=1, locked=1, updated_at=? WHERE id='li_yi';`).run(
    now
  );

  dbSingleton = db;
  return db;
}

/**
 * node:sqlite 会直接写入文件，不再需要 export/persist。
 * 为了尽量少改动现有 API 路由代码，这里保留一个空实现。
 */
export function persistDb(db: DatabaseSync) {
  // noop
  void db;
}

/**
 * 兼容旧 sql.js 的 rowsFromExec，用于渐进迁移。
 * node:sqlite 下建议直接使用 stmt.all() / stmt.get()。
 */
export function rowsFromExec<T extends Record<string, unknown>>(
  res: unknown
): T[] {
  void res;
  return [];
}

export type Db = DatabaseSync;
export type Stmt = StatementSync;
