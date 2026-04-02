import { z } from "zod";

import { getDb } from "@/lib/bible/db";
import type { PlotlineRow } from "@/lib/bible/types";
import { getIdFromUrl, IdSchema, json } from "../_shared";

export const runtime = "nodejs";

type AnyRow = Record<string, unknown>;

function mapRow(r: AnyRow): PlotlineRow {
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    rule: String(r.rule ?? ""),
    trigger: String(r.trigger ?? ""),
    status: (r.status === "triggered" ? "triggered" : "untriggered") as PlotlineRow["status"],
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
  };
}

const UpsertSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  rule: z.string().optional().default(""),
  trigger: z.string().optional().default(""),
  status: z.enum(["untriggered", "triggered"]).optional().default("untriggered"),
});

export async function GET() {
  const db = await getDb();
  const rows = db.prepare(`SELECT * FROM plotlines ORDER BY status ASC, name ASC;`).all() as AnyRow[];
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
  const id = p.id || `p_${crypto.randomUUID()}`;
  const db = await getDb();
  db.prepare(
    `INSERT INTO plotlines(id,name,rule,trigger,status,created_at,updated_at)
     VALUES(?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       rule=excluded.rule,
       trigger=excluded.trigger,
       status=excluded.status,
       updated_at=excluded.updated_at;`,
  ).run(id, p.name, p.rule, p.trigger, p.status, now, now);

  const row = db.prepare(`SELECT * FROM plotlines WHERE id=?`).get(id) as AnyRow | undefined;
  return json({ data: row ? mapRow(row) : null });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = z
    .object({ id: IdSchema, status: z.enum(["untriggered", "triggered"]) })
    .safeParse(body);
  if (!parsed.success) {
    return json({ error: "Bad Request", details: parsed.error.flatten() }, { status: 400 });
  }
  const db = await getDb();
  const now = new Date().toISOString();
  db.prepare(`UPDATE plotlines SET status=?, updated_at=? WHERE id=?;`).run(
    parsed.data.status,
    now,
    parsed.data.id
  );
  return json({ ok: true });
}

export async function DELETE(req: Request) {
  const id = getIdFromUrl(req.url);
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) return json({ error: "Missing id" }, { status: 400 });
  const db = await getDb();
  db.prepare(`DELETE FROM plotlines WHERE id=?;`).run(parsed.data);
  return json({ ok: true });
}
