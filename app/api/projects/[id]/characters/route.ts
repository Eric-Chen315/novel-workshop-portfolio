import { NextResponse } from "next/server";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

import { getProjectKnowledgeDir } from "@/lib/storage/projectStore";

export const runtime = "nodejs";

function getProjectBibleDbPath(projectId: string) {
  return path.join(getProjectKnowledgeDir(projectId), "bible.sqlite");
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  const dbPath = getProjectBibleDbPath(projectId);
  if (!fs.existsSync(dbPath)) {
    return NextResponse.json({ names: [] });
  }

  const db = new Database(dbPath, { readonly: true });
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const names = new Set(tables.map((t) => t.name));
    if (!names.has("characters")) return NextResponse.json({ names: [] });

    // 兼容不同字段：优先 name
    const rows = db.prepare("SELECT name FROM characters WHERE name IS NOT NULL AND TRIM(name) <> ''").all() as {
      name: string;
    }[];
    const list = rows.map((r) => r.name).filter(Boolean);
    return NextResponse.json({ names: Array.from(new Set(list)) });
  } catch (e) {
    return NextResponse.json({ error: "Failed to load characters" }, { status: 500 });
  } finally {
    db.close();
  }
}
