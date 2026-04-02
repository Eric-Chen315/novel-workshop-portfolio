import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { Character } from "../types/character";
import { DATA_ROOT } from "./dataRoot";

function getBibleDbPath(projectId: string) {
  return path.join(DATA_ROOT, projectId, "knowledge", "bible.sqlite");
}

export function getAllCharacters(projectId: string): Character[] {
  const dbPath = getBibleDbPath(projectId);
  
  // 如果数据库不存在，返回空数组
  if (!fs.existsSync(dbPath)) return [];
  
  try {
    const db = new Database(dbPath, { readonly: true });
    
    // 检查 characters 表是否存在
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='characters'").get();
    if (!tableExists) {
      db.close();
      return [];
    }
    
    // 从 SQLite 读取所有角色
    const rows = db.prepare("SELECT * FROM characters ORDER BY createdAt DESC").all() as any[];
    db.close();
    
    if (!rows || rows.length === 0) return [];
    
    // 转换为 Character 格式
    return rows.map((row) => ({
      id: row.id,
      name: row.name || "",
      role: row.role || "",
      gender: row.gender || "",
      appearance: row.appearance || "",
      personality: row.personality || "",
      speechStyle: row.speechStyle || "",
      background: row.background || "",
      currentState: row.currentStatus || "",
      relationships: [],
      updatedAt: row.updatedAt || row.createdAt || new Date().toISOString(),
      // 额外字段
      aliases: row.aliases || "",
      behaviorRules: row.behaviorRules || "",
      growthArc: row.growthArc || "",
      sampleDialogue: row.sampleDialogue || "",
      keyEvents: row.keyEvents || "",
    }));
  } catch (error) {
    console.error("从 SQLite 读取角色失败:", error);
    return [];
  }
}

function getCharacterFilePath(projectId: string) {
  return path.join(DATA_ROOT, projectId, "knowledge", "characters.json");
}

export function getCharacter(projectId: string, characterId: string): Character | null {
  const characters = getAllCharacters(projectId);
  return characters.find((c) => c.id === characterId) || null;
}

export function createCharacter(projectId: string, character: Omit<Character, "id" | "updatedAt">): Character {
  const dbPath = getBibleDbPath(projectId);
  
  // 如果 SQLite 数据库存在且有 characters 表，插入到 SQLite
  if (fs.existsSync(dbPath)) {
    try {
      const db = new Database(dbPath);
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      
      db.prepare(`
        INSERT INTO characters (id, name, aliases, gender, role, appearance, background, personality, speechStyle, behaviorRules, growthArc, currentStatus, sampleDialogue, keyEvents, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        character.name || "",
        character.aliases || "",
        character.gender || "",
        character.role || "",
        character.appearance || "",
        character.background || "",
        character.personality || "",
        character.speechStyle || "",
        character.behaviorRules || "",
        character.growthArc || "",
        character.currentState || "",
        character.sampleDialogue || "",
        character.keyEvents || "",
        now,
        now
      );
      
      db.close();
      return { id, ...character, updatedAt: now } as Character;
    } catch (error) {
      console.error("插入角色到 SQLite 失败:", error);
    }
  }
  
  // 兜底：写入 JSON 文件
  const characters = getAllCharacters(projectId);
  const newCharacter: Character = {
    id: crypto.randomUUID(),
    ...character,
    updatedAt: new Date().toISOString(),
  };
  characters.push(newCharacter);
  fs.writeFileSync(getCharacterFilePath(projectId), JSON.stringify(characters, null, 2), "utf-8");
  return newCharacter;
}

export function updateCharacter(projectId: string, characterId: string, patch: Partial<Omit<Character, "id" | "updatedAt">>): Character | null {
  const dbPath = getBibleDbPath(projectId);
  const now = new Date().toISOString();
  
  // 如果 SQLite 数据库存在且有 characters 表，更新 SQLite
  if (fs.existsSync(dbPath)) {
    try {
      const db = new Database(dbPath);
      
      // 构建动态更新语句
      const fields: string[] = [];
      const values: any[] = [];
      
      if (patch.name !== undefined) { fields.push("name = ?"); values.push(patch.name); }
      if (patch.aliases !== undefined) { fields.push("aliases = ?"); values.push(patch.aliases); }
      if (patch.gender !== undefined) { fields.push("gender = ?"); values.push(patch.gender); }
      if (patch.role !== undefined) { fields.push("role = ?"); values.push(patch.role); }
      if (patch.appearance !== undefined) { fields.push("appearance = ?"); values.push(patch.appearance); }
      if (patch.background !== undefined) { fields.push("background = ?"); values.push(patch.background); }
      if (patch.personality !== undefined) { fields.push("personality = ?"); values.push(patch.personality); }
      if (patch.speechStyle !== undefined) { fields.push("speechStyle = ?"); values.push(patch.speechStyle); }
      if (patch.behaviorRules !== undefined) { fields.push("behaviorRules = ?"); values.push(patch.behaviorRules); }
      if (patch.growthArc !== undefined) { fields.push("growthArc = ?"); values.push(patch.growthArc); }
      if (patch.currentState !== undefined) { fields.push("currentStatus = ?"); values.push(patch.currentState); }
      if (patch.sampleDialogue !== undefined) { fields.push("sampleDialogue = ?"); values.push(patch.sampleDialogue); }
      if (patch.keyEvents !== undefined) { fields.push("keyEvents = ?"); values.push(patch.keyEvents); }
      
      fields.push("updatedAt = ?");
      values.push(now);
      values.push(characterId);
      
      db.prepare(`UPDATE characters SET ${fields.join(", ")} WHERE id = ?`).run(...values);
      db.close();
      
      return getCharacter(projectId, characterId);
    } catch (error) {
      console.error("更新 SQLite 角色失败:", error);
    }
  }
  
  // 兜底：从 JSON 文件更新
  const characters = getAllCharacters(projectId);
  const index = characters.findIndex((c) => c.id === characterId);
  if (index === -1) return null;
  const updatedCharacter = {
    ...characters[index],
    ...patch,
    updatedAt: now,
  };
  characters[index] = updatedCharacter;
  fs.writeFileSync(getCharacterFilePath(projectId), JSON.stringify(characters, null, 2), "utf-8");
  return updatedCharacter;
}

export function deleteCharacter(projectId: string, characterId: string): boolean {
  const dbPath = getBibleDbPath(projectId);
  
  // 如果 SQLite 数据库存在且有 characters 表，从 SQLite 删除
  if (fs.existsSync(dbPath)) {
    try {
      const db = new Database(dbPath);
      db.prepare("DELETE FROM characters WHERE id = ?").run(characterId);
      db.close();
      return true;
    } catch (error) {
      console.error("从 SQLite 删除角色失败:", error);
    }
  }
  
  // 兜底：从 JSON 文件删除
  const characters = getAllCharacters(projectId);
  const index = characters.findIndex((c) => c.id === characterId);
  if (index === -1) return false;
  characters.splice(index, 1);
  fs.writeFileSync(getCharacterFilePath(projectId), JSON.stringify(characters, null, 2), "utf-8");
  return true;
}
