import { z } from "zod";

import { getDb } from "@/lib/bible/db";
import type { DeprecatedRow } from "@/lib/bible/types";
import { getIdFromUrl, IdSchema, json } from "../_shared";

export const runtime = "nodejs";

type AnyRow = Record<string, unknown>;

function mapRow(r: AnyRow): DeprecatedRow {
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    content: String(r.content ?? ""),
    reason: String(r.reason ?? ""),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
  };
}

const UpsertSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  content: z.string().optional().default(""),
  reason: z.string().optional().default(""),
});

export async function GET() {
  const db = await getDb();
  const rows = db.prepare(`SELECT * FROM deprecated ORDER BY name ASC;`).all() as AnyRow[];
  return json({ data: rows.map(mapRow) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Bad Request", details: parsed.error.flatten() }, { status: 400 });
  }
  const now = new Date().toISOString();
  const p = parsed.data;
  const id = p.id || `d_${crypto.randomUUID()}`;
  const db = await getDb();
  db.prepare(
    `INSERT INTO deprecated(id,name,content,reason,created_at,updated_at)
     VALUES(?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       content=excluded.content,
       reason=excluded.reason,
       updated_at=excluded.updated_at;`,
  ).run(id, p.name, p.content, p.reason, now, now);

  const row = db.prepare(`SELECT * FROM deprecated WHERE id=?`).get(id) as AnyRow | undefined;
  return json({ data: row ? mapRow(row) : null });
}

export async function DELETE(req: Request) {
  const id = getIdFromUrl(req.url);
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) return json({ error: "Missing id" }, { status: 400 });
  const db = await getDb();
  db.prepare(`DELETE FROM deprecated WHERE id=?;`).run(parsed.data);
  return json({ ok: true });
}
