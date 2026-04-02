import { z } from "zod";

import { getDb } from "@/lib/bible/db";
import type { CharacterRow } from "@/lib/bible/types";
import { getIdFromUrl, IdSchema, json } from "../_shared";

export const runtime = "nodejs";

type AnyRow = Record<string, unknown>;

function mapCharacterRow(r: AnyRow): CharacterRow {
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    ageAppearance: String(r.age_appearance ?? ""),
    background: String(r.background ?? ""),
    personality: String(r.personality ?? ""),
    speakingStyle: String(r.speaking_style ?? ""),
    catchphrase: String(r.catchphrase ?? ""),
    currentLocation: String(r.current_location ?? ""),
    currentStatus: String(r.current_status ?? ""),
    defaultInject: Number(r.default_inject ?? 0) as 0 | 1,
    locked: Number(r.locked ?? 0) as 0 | 1,
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
  };
}

const UpsertSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  ageAppearance: z.string().optional().default(""),
  background: z.string().optional().default(""),
  personality: z.string().optional().default(""),
  speakingStyle: z.string().optional().default(""),
  catchphrase: z.string().optional().default(""),
  currentLocation: z.string().optional().default(""),
  currentStatus: z.string().optional().default(""),
  defaultInject: z.union([z.literal(0), z.literal(1)]).optional().default(0),
});

export async function GET() {
  const db = await getDb();
  const rows = db
    .prepare(`SELECT * FROM characters ORDER BY locked DESC, default_inject DESC, name ASC;`)
    .all() as AnyRow[];
  return json({ data: rows.map(mapCharacterRow) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = UpsertSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Bad Request", details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();
  const p = parsed.data;
  const id = p.id || `c_${crypto.randomUUID()}`;

  // 防止把兜底的 li_yi（李弈）这一行「更新成空名字」
  // - li_yi 只允许更新除 name/defaultInject/locked 之外的字段
  // - name 始终固定为“李弈”
  const isLiYi = id === "li_yi";

  const db = await getDb();
  db.prepare(
    `INSERT INTO characters(
      id,name,age_appearance,background,personality,speaking_style,catchphrase,current_location,current_status,default_inject,locked,created_at,updated_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,0,?,?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      age_appearance=excluded.age_appearance,
      background=excluded.background,
      personality=excluded.personality,
      speaking_style=excluded.speaking_style,
      catchphrase=excluded.catchphrase,
      current_location=excluded.current_location,
      current_status=excluded.current_status,
      default_inject=excluded.default_inject,
      updated_at=excluded.updated_at;`,
  )
    .run(
      id,
      isLiYi ? "李弈" : p.name,
      p.ageAppearance,
      p.background,
      p.personality,
      p.speakingStyle,
      p.catchphrase,
      p.currentLocation,
      p.currentStatus,
      isLiYi ? 1 : p.defaultInject,
      now,
      now
    );

  // 保证李弈规则：必须默认注入且不可取消
  db.prepare(`UPDATE characters SET default_inject=1, locked=1, updated_at=? WHERE id='li_yi';`).run(
    now
  );

  const row = db.prepare(`SELECT * FROM characters WHERE id=?`).get(id) as AnyRow | undefined;
  return json({ data: row ? mapCharacterRow(row) : null });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = z
    .object({ id: IdSchema, defaultInject: z.union([z.literal(0), z.literal(1)]) })
    .safeParse(body);
  if (!parsed.success) {
    return json({ error: "Bad Request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, defaultInject } = parsed.data;
  if (id === "li_yi") {
    return json({ error: "李弈默认注入不可取消" }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date().toISOString();
  db.prepare(`UPDATE characters SET default_inject=?, updated_at=? WHERE id=? AND locked=0;`).run(
    defaultInject,
    now,
    id
  );
  db.prepare(`UPDATE characters SET default_inject=1, locked=1, updated_at=? WHERE id='li_yi';`).run(
    now
  );
  return json({ ok: true });
}

export async function DELETE(req: Request) {
  const id = getIdFromUrl(req.url);
  const parsed = IdSchema.safeParse(id);
  if (!parsed.success) {
    return json({ error: "Missing id" }, { status: 400 });
  }
  if (parsed.data === "li_yi") {
    return json({ error: "李弈不可删除" }, { status: 400 });
  }

  const db = await getDb();
  db.prepare(`DELETE FROM characters WHERE id=? AND locked=0;`).run(parsed.data);
  return json({ ok: true });
}
