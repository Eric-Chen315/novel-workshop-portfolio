import { CHARACTER_BIBLE_CORE_SUMMARY } from "@/lib/prompts/character-bible";
import { buildBibleSummary } from "./format";
import { getDb } from "./db";
import { getAllCharacters } from "../storage/characterStore";
import type { Character } from "../types/character";
import type { CharacterRow, DeprecatedRow, PlotlineRow, SettingRow } from "./types";

type AnyRow = Record<string, unknown>;

function mapCharacter(r: AnyRow): CharacterRow {
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

function mapSetting(r: AnyRow): SettingRow {
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    status: String(r.status ?? ""),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
  };
}

function mapPlotline(r: AnyRow): PlotlineRow {
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

function mapDeprecated(r: AnyRow): DeprecatedRow {
  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    content: String(r.content ?? ""),
    reason: String(r.reason ?? ""),
    createdAt: String(r.created_at ?? ""),
    updatedAt: String(r.updated_at ?? ""),
  };
}

/**
 * 从项目级角色列表构建简要摘要字符串（格式与 buildBibleSummary 保持一致）
 */
function buildProjectBibleSummary(characters: Character[]): string {
  const lines: string[] = ["【角色圣经·核心摘要】"];
  for (const char of characters) {
    let line = `${char.name}：${char.personality || ""}`.trimEnd();
    if (char.speechStyle) line += `，${char.speechStyle}`;
    if (char.currentState) line += `，${char.currentState}`;
    lines.push(line.replace(/，+/g, "，").replace(/：，/g, "：").trim());
  }
  return lines.join("\n");
}

/**
 * 优先从项目级角色库（bible.sqlite）读取摘要；
 * 无项目数据时回退到全局 bible.sqlite；
 * 全局库也为空时回退硬编码兜底。
 */
export async function getBibleCoreSummary(projectId?: string): Promise<string> {
  // 优先：从项目级角色数据库读取
  if (projectId) {
    try {
      const chars = getAllCharacters(projectId);
      if (chars.length > 0) return buildProjectBibleSummary(chars);
    } catch {
      // 读取失败，继续回退到全局
    }
  }

  // 兜底：全局 bible.sqlite
  try {
    const db = await getDb();
    const characters = (db.prepare(`SELECT * FROM characters;`).all() as AnyRow[]).map(mapCharacter);
    const settings = (db.prepare(`SELECT * FROM settings;`).all() as AnyRow[]).map(mapSetting);
    const plotlines = (db.prepare(`SELECT * FROM plotlines;`).all() as AnyRow[]).map(mapPlotline);
    const deprecated = (db.prepare(`SELECT * FROM deprecated;`).all() as AnyRow[]).map(mapDeprecated);

    const hasAny =
      characters.length > 0 || settings.length > 0 || plotlines.length > 0 || deprecated.length > 0;

    if (!hasAny) return CHARACTER_BIBLE_CORE_SUMMARY;

    // 如果只有兜底李弈一条且其它为空，依然视为“空库”，回退硬编码，确保体验与旧版一致
    const onlyLiYi = characters.length === 1 && characters[0]?.id === "li_yi";
    if (onlyLiYi && settings.length === 0 && plotlines.length === 0 && deprecated.length === 0) {
      return CHARACTER_BIBLE_CORE_SUMMARY;
    }

    return buildBibleSummary({
      characters,
      settings,
      plotlines,
      deprecated,
    });
  } catch {
    // 任意 DB 异常都回退硬编码，保证系统可用
    return CHARACTER_BIBLE_CORE_SUMMARY;
  }
}
