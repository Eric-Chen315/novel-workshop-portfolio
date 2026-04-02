/**
 * 导入脚本：将角色圣经TXT文件解析并导入到 Bible SQLite 数据库
 * 运行方式：npx tsx scripts/importBible.ts
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

type StatementSync = {
  run: (...params: unknown[]) => unknown;
  get: (...params: unknown[]) => unknown;
  all: (...params: unknown[]) => unknown[];
};

type DatabaseSync = {
  exec: (sql: string) => void;
  prepare: (sql: string) => StatementSync;
};

function loadSqlite(): { DatabaseSync: new (filename: string) => DatabaseSync } {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  return require("node:sqlite") as { DatabaseSync: new (filename: string) => DatabaseSync };
}

function getDbFilePath() {
  return path.join(process.cwd(), "data", "bible.sqlite");
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// 角色圣经文件路径
const BIBLE_FILE = "D:\\陈红义\\破局\\自由职业\\AI小说\\番茄小说\\《本想败光十个亿，结果成了教父》\\纲领\\角色画像\\角色圣经.txt";

function generateId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
}

function readBibleFile(): string {
  // 先尝试 UTF-8
  try {
    const content = fs.readFileSync(BIBLE_FILE, "utf-8");
    // 检查是否乱码（包含大量  或乱码特征）
    if (!content.includes("👑") && !content.includes("主角")) {
      throw new Error("UTF-8解码可能乱码");
    }
    return content;
  } catch {
    // 尝试 GBK - Node.js 原生不支持，用 iconv-lite 或手动转码
    // 这里用 Buffer + toString 尝试常见编码
    try {
      const buffer = fs.readFileSync(BIBLE_FILE);
      // 尝试用 GBK 解码
      return buffer.toString("gbk");
    } catch (e) {
      throw new Error(`无法读取文件: ${e}`);
    }
  }
}

interface Character {
  id: string;
  name: string;
  age_appearance: string;
  background: string;
  personality: string;
  speaking_style: string;
  catchphrase: string;
  current_location: string;
  current_status: string;
  default_inject: number;
  locked: number;
  created_at: string;
  updated_at: string;
}

interface Setting {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Plotline {
  id: string;
  name: string;
  rule: string;
  trigger: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Deprecated {
  id: string;
  name: string;
  content: string;
  reason: string;
  created_at: string;
  updated_at: string;
}

function parseCharacters(content: string): Character[] {
  const characters: Character[] = [];
  const now = new Date().toISOString();

  // 定义角色块识别 - 以特定emoji开头的行（支持变体）
  const characterPatterns = [
    { emoji: "👑", name: "李弈", type: "主角" },
    { emoji: "💼", name: "魏莱", type: "核心配角" },
    { emoji: "🔬", name: "赵光", type: "核心配角" },
    { emoji: "🔨", name: "刘大爷", type: "核心配角" },
    { emoji: "💻", name: "王代码", type: "核心配角" },
    // 灰衣人：先尝试🧛，再尝试🧛‍♂️
    // 陈默：先尝试🕵️，再尝试🕵️‍♂️
  ];

  // 解析主要角色（基础emoji）
  for (const pattern of characterPatterns) {
    const emoji = pattern.emoji;
    const name = pattern.name;
    
    const startIdx = content.indexOf(emoji + " ");
    if (startIdx === -1) continue;
    
    const nextCharMatch = content.slice(startIdx + 1).match(/^[👑💼🔬🔨💻🧛🕵️🛡️]/m);
    const nextSettingMatch = content.slice(startIdx + 1).match(/^📦/m);
    
    let endIdx = content.length;
    if (nextCharMatch) {
      const relPos = content.slice(startIdx + 1).indexOf(nextCharMatch[0]);
      if (relPos !== -1) endIdx = startIdx + 1 + relPos;
    }
    if (nextSettingMatch) {
      const relPos = content.slice(startIdx + 1).indexOf(nextSettingMatch[0]);
      if (relPos !== -1) endIdx = Math.min(endIdx, startIdx + 1 + relPos);
    }
    
    const block = content.slice(startIdx, endIdx);
    const blockLines = block.split("\n");
    
    const char: Character = {
      id: generateId(name),
      name: name,
      age_appearance: "",
      background: "",
      personality: "",
      speaking_style: "",
      catchphrase: "",
      current_location: "",
      current_status: "",
      default_inject: 1,
      locked: 0,
      created_at: now,
      updated_at: now,
    };

    let currentField = "";
    for (const line of blockLines) {
      const trimmed = line.trim();
      
      if (trimmed.match(/^[👑💼🔬🔨💻🧛🕵️🛡️].*[：:]/)) {
        continue;
      }
      
      if (trimmed.startsWith("* 年龄/外貌") || trimmed.startsWith("*年龄/外貌")) {
        currentField = "age_appearance";
        char.age_appearance = trimmed.replace(/^\*?\s*年龄\/外貌[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 前世身份")) {
        currentField = "background";
        char.background = trimmed.replace(/^\*\s*前世身份[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 今世身份")) {
        currentField = "background";
        if (char.background) char.background += "\n";
        char.background += trimmed.replace(/^\*\s*今世身份[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 背景")) {
        currentField = "background";
        if (char.background) char.background += "\n";
        char.background += trimmed.replace(/^\*\s*背景[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 核心性格")) {
        currentField = "personality";
        char.personality = trimmed.replace(/^\*\s*核心性格[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 说话风格")) {
        currentField = "speaking_style";
        char.speaking_style = trimmed.replace(/^\*\s*说话风格[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 原文范例")) {
        currentField = "catchphrase";
        char.catchphrase = trimmed.replace(/^\*\s*原文范例[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 当前状态") || trimmed.startsWith("*当前状态")) {
        currentField = "current_status";
        char.current_status = trimmed.replace(/^\*?\s*当前状态[（]?[^）]*[）]?[：:]?\s*/, "").replace("截至129章", "").trim();
      } else if (trimmed.startsWith("* 当前位置")) {
        currentField = "current_location";
        char.current_location = trimmed.replace(/^\*\s*当前位置[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 金手指")) {
        currentField = "personality";
        if (char.personality) char.personality += "\n";
        char.personality += "金手指: " + trimmed.replace(/^\*\s*金手指[^（]*（?[^）]*）?[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 功能定位")) {
        currentField = "personality";
        if (char.personality) char.personality += "\n";
        char.personality += "功能定位: " + trimmed.replace(/^\*\s*功能定位[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 成长弧线")) {
        currentField = "personality";
        if (char.personality) char.personality += "\n";
        char.personality += "成长弧线: " + trimmed.replace(/^\*\s*成长弧线[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 迪化体质")) {
        currentField = "personality";
        if (char.personality) char.personality += "\n";
        char.personality += "迪化体质: " + trimmed.replace(/^\*\s*迪化体质[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 身份")) {
        currentField = "background";
        if (char.background) char.background += "\n";
        char.background += trimmed.replace(/^\*\s*身份[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 真实身份")) {
        currentField = "background";
        if (char.background) char.background += "\n";
        char.background += trimmed.replace(/^\*\s*真实身份[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("  * ") || trimmed.startsWith("   * ")) {
        const subContent = trimmed.replace(/^[\s*]+/, "").trim();
        if (currentField === "personality" && char.personality) {
          char.personality += "\n" + subContent;
        } else if (currentField === "speaking_style" && char.speaking_style) {
          char.speaking_style += "\n" + subContent;
        } else if (currentField === "background" && char.background) {
          char.background += "\n" + subContent;
        } else if (currentField === "catchphrase" && char.catchphrase) {
          char.catchphrase += "\n" + subContent;
        } else if (currentField === "current_status" && char.current_status) {
          char.current_status += "\n" + subContent;
        } else if (currentField === "age_appearance" && char.age_appearance) {
          char.age_appearance += "\n" + subContent;
        }
      } else if (trimmed.startsWith("* ") && currentField) {
        const subContent = trimmed.replace(/^\*\s*/, "").trim();
        if (currentField === "personality" && char.personality) {
          char.personality += "\n" + subContent;
        } else if (currentField === "speaking_style" && char.speaking_style) {
          char.speaking_style += "\n" + subContent;
        } else if (currentField === "background" && char.background) {
          char.background += "\n" + subContent;
        } else if (currentField === "catchphrase" && char.catchphrase) {
          char.catchphrase += "\n" + subContent;
        } else if (currentField === "current_status" && char.current_status) {
          char.current_status += "\n" + subContent;
        } else if (currentField === "age_appearance" && char.age_appearance) {
          char.age_appearance += "\n" + subContent;
        }
      }
    }

    characters.push(char);
  }

  // 解析灰衣人（尝试🧛和🧛‍♂️）
  const huiyiEmojis = ["🧛", "🧛‍♂️"];
  for (const emoji of huiyiEmojis) {
    if (characters.some(c => c.name === "灰衣人")) break;
    const startIdx = content.indexOf(emoji + " ");
    if (startIdx === -1) continue;
    
    const nextMatch = content.slice(startIdx + 1).match(/^[👑💼🔬🔨💻🧛🕵️📦]/m);
    let endIdx = content.length;
    if (nextMatch) {
      const relPos = content.slice(startIdx + 1).indexOf(nextMatch[0]);
      if (relPos !== -1) endIdx = startIdx + 1 + relPos;
    }
    
    const block = content.slice(startIdx, endIdx);
    const blockLines = block.split("\n");
    
    const char: Character = {
      id: generateId("灰衣人"),
      name: "灰衣人",
      age_appearance: "",
      background: "",
      personality: "",
      speaking_style: "",
      catchphrase: "",
      current_location: "",
      current_status: "",
      default_inject: 1,
      locked: 0,
      created_at: now,
      updated_at: now,
    };

    let currentField = "";
    for (const line of blockLines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[👑💼🔬🔨💻🧛🕵️🛡️].*[：:]/)) continue;
      
      if (trimmed.startsWith("* 身份") || trimmed.startsWith("*真实身份")) {
        currentField = "background";
        char.background = trimmed.replace(/^\*\s*(身份|真实身份)[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 核心性格")) {
        currentField = "personality";
        char.personality = trimmed.replace(/^\*\s*核心性格[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 说话风格")) {
        currentField = "speaking_style";
        char.speaking_style = trimmed.replace(/^\*\s*说话风格[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 当前状态")) {
        currentField = "current_status";
        char.current_status = trimmed.replace(/^\*\s*当前状态[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("  * ") || trimmed.startsWith("   * ")) {
        const subContent = trimmed.replace(/^[\s*]+/, "").trim();
        if (currentField === "personality" && char.personality) char.personality += "\n" + subContent;
        else if (currentField === "speaking_style" && char.speaking_style) char.speaking_style += "\n" + subContent;
        else if (currentField === "background" && char.background) char.background += "\n" + subContent;
        else if (currentField === "current_status" && char.current_status) char.current_status += "\n" + subContent;
      }
    }
    characters.push(char);
  }

  // 解析陈默（尝试🕵️和🕵️‍♂️）
  const chenmoEmojis = ["🕵️", "🕵️‍♂️"];
  for (const emoji of chenmoEmojis) {
    if (characters.some(c => c.name === "陈默")) break;
    const startIdx = content.indexOf(emoji + " ");
    if (startIdx === -1) continue;
    
    const nextMatch = content.slice(startIdx + 1).match(/^[👑💼🔬🔨💻🧛🕵️📦]/m);
    let endIdx = content.length;
    if (nextMatch) {
      const relPos = content.slice(startIdx + 1).indexOf(nextMatch[0]);
      if (relPos !== -1) endIdx = startIdx + 1 + relPos;
    }
    
    const block = content.slice(startIdx, endIdx);
    const blockLines = block.split("\n");
    
    const char: Character = {
      id: generateId("陈默"),
      name: "陈默",
      age_appearance: "",
      background: "",
      personality: "",
      speaking_style: "",
      catchphrase: "",
      current_location: "",
      current_status: "",
      default_inject: 1,
      locked: 0,
      created_at: now,
      updated_at: now,
    };

    let currentField = "";
    for (const line of blockLines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[👑💼🔬🔨💻🧛🕵️🛡️].*[：:]/)) continue;
      
      if (trimmed.startsWith("* 真实身份")) {
        currentField = "background";
        char.background = trimmed.replace(/^\*\s*真实身份[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 身份")) {
        currentField = "background";
        char.background = trimmed.replace(/^\*\s*身份[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 核心性格")) {
        currentField = "personality";
        char.personality = trimmed.replace(/^\*\s*核心性格[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("* 当前状态")) {
        currentField = "current_status";
        char.current_status = trimmed.replace(/^\*\s*当前状态[：:]?\s*/, "").trim();
      } else if (trimmed.startsWith("  * ") || trimmed.startsWith("   * ")) {
        const subContent = trimmed.replace(/^[\s*]+/, "").trim();
        if (currentField === "personality" && char.personality) char.personality += "\n" + subContent;
        else if (currentField === "background" && char.background) char.background += "\n" + subContent;
        else if (currentField === "current_status" && char.current_status) char.current_status += "\n" + subContent;
      }
    }
    characters.push(char);
  }

  // 从最终补丁中提取李半城
  const libaiChengSection = content.match(/主角父亲[：:]([^\n]+)/);
  if (libaiChengSection) {
    characters.push({
      id: generateId("李半城"),
      name: "李半城",
      age_appearance: "",
      background: "海城首富 / 试炼发布者。李弈的父亲，千亿商业帝国的掌舵人，本书'5000万限期一个月创业试炼'的始作俑者。",
      personality: "威严、传统、奉行极致的'狼性商业法则'。表面上对李弈这个'废物小儿子'恨铁不成钢，实际上一直通过财报和暗线关注着他。迪化体质：他的迪化与其他人的'狂热崇拜'不同，属于'三观崩塌式迪化'。看着李弈瞎搞却不断缔造奇迹，他陷入了深深的自我怀疑。",
      speaking_style: "威严、命令式，商业术语丰富",
      catchphrase: "",
      current_location: "海城大本营",
      current_status: "在海城大本营遥望大西北，对红星芯片的诞生感到震颤，随时准备在后续作为家族线、资本线的核心碰撞点回归",
      default_inject: 1,
      locked: 0,
      created_at: now,
      updated_at: now,
    });
  }

  return characters;
}

function parseSettings(content: string): Setting[] {
  const settings: Setting[] = [];
  const now = new Date().toISOString();

  // 找到关键道具/设定速查池段落
  const poolStart = content.indexOf("📦 关键道具/设定速查池");
  if (poolStart === -1) return settings;

  // 找到下一个段落
  const poolEnd = content.indexOf("________________", poolStart + 10);
  const poolContent = poolEnd !== -1 ? content.slice(poolStart, poolEnd) : content.slice(poolStart);

  // 设定项列表 - 按文件中顺序
  const settingNames = [
    "系统 V3.0",
    "红星方便面",
    "《黑神话：悟空》",
    "逆风物流",
    "504厂",
    "光子芯片 V1.0",
    "光子芯片 V2.0",
    "核聚变图纸碎片",
  ];

  for (const name of settingNames) {
    const namePos = poolContent.indexOf(name);
    if (namePos === -1) continue;

    // 提取该设定的内容
    const afterName = poolContent.slice(namePos + name.length);
    
    // 查找卷属 - 可能是"|"分隔或后面的内容
    let status = "";
    let description = "";

    // 尝试找到"|"分隔
    const pipeMatch = afterName.match(/^\s*[|]\s*([^|]+?)\s*[|]/);
    if (pipeMatch) {
      status = pipeMatch[1].trim();
      description = pipeMatch[2]?.trim() || "";
    } else {
      // 尝试直接提取后续内容
      const lines = afterName.split("\n").filter(l => l.trim());
      if (lines.length > 0) {
        // 第一行通常是卷属
        status = lines[0].replace(/^[|\s]+|[|\s]+$/g, "").trim();
        if (lines.length > 1) {
          description = lines.slice(1).join(" ").replace(/^[|\s]+|[|\s]+$/g, "").trim();
        }
      }
    }

    // 如果解析不到，尝试更简单的方式
    if (!status) {
      const parts = poolContent.slice(namePos).split("\n");
      for (let i = 1; i < parts.length; i++) {
        const line = parts[i].trim();
        if (line && !line.startsWith("*") && !line.startsWith("📦") && !line.startsWith("名称")) {
          if (line.includes("卷") || line.includes("第")) {
            status = line.replace(/^[|\s]+|[|\s]+$/g, "").trim();
          } else if (line.length > 5) {
            description = line.replace(/^[|\s]+|[|\s]+$/g, "").trim();
          }
          if (status && description) break;
        }
      }
    }

    settings.push({
      id: generateId(name),
      name: name,
      description: description,
      status: status,
      created_at: now,
      updated_at: now,
    });
  }

  return settings;
}

function parsePlotlines(content: string): Plotline[] {
  const plotlines: Plotline[] = [];
  const now = new Date().toISOString();

  // 1. 魏莱迪化约束
  plotlines.push({
    id: generateId("魏莱迪化约束"),
    name: "魏莱迪化约束",
    rule: "魏莱的迪化脑补必须严格遵守事后合理化原则：✅允许：李弈做完决定后，魏莱用金融逻辑将败家行为解读为神级商业布局。❌禁止：魏莱在李弈决策前猜到其真实败家意图。原因：读者的信息差优越感是本书核心喜剧结构，魏莱提前看穿=结构坍塌。",
    trigger: "每次魏莱解读李弈行为时",
    status: "untriggered",
    created_at: now,
    updated_at: now,
  });

  // 2. 系统V3.0惩罚量化
  plotlines.push({
    id: generateId("系统V3.0惩罚量化"),
    name: "系统V3.0惩罚量化",
    rule: "触发条件：连续三个自然月项目净盈利。惩罚：每月扣除一张黑科技图纸碎片。扣完上限：已有碎片扣至0。解除：任意一个月净亏损即重置。",
    trigger: "连续三个自然月净盈利",
    status: "untriggered",
    created_at: now,
    updated_at: now,
  });

  // 3. 刘大爷帕金森暗线约束
  plotlines.push({
    id: generateId("刘大爷帕金森暗线约束"),
    name: "刘大爷帕金森暗线约束",
    rule: "当前阶段仅允许写伏笔（偷偷吃药、手指微震、回避精细操作场合）。引爆条件：作者手动下达引爆指令。引爆点已确定为第175章。第166-174章严格执行暗线规则，任何角色不得说破。",
    trigger: "作者手动下达引爆帕金森线指令",
    status: "untriggered",
    created_at: now,
    updated_at: now,
  });

  // 4. 配角弧线时间轴
  const arcEvents = [
    { name: "魏莱-第120章-独立决策", rule: "第一次独立决策（非请示李弈，镇压供应商）", status: "untriggered" },
    { name: "魏莱-第123章-追查陈默", rule: "猎巫篇连夜追查陈默身份", status: "untriggered" },
    { name: "赵光-第二卷-首次登场", rule: "首次登场/加入红星（约第65-70章）", status: "triggered" },
    { name: "赵光-第118章-土洋之争", rule: "与刘大爷土洋之争爆发与和解", status: "triggered" },
    { name: "赵光-第124章-被冤出走", rule: "猎巫篇被冤枉出走", status: "triggered" },
    { name: "赵光-第125章-V2.0诞生", rule: "被李弈鞠躬追回，V2.0诞生", status: "triggered" },
    { name: "刘大爷-第116章-手搓透镜", rule: "手搓纳米级透镜首次惊艳全网", status: "triggered" },
    { name: "刘大爷-第166章-帕金森伏笔", rule: "帕金森伏笔首次出现（手部微震）", trigger: "第166章", status: "untriggered" },
    { name: "王代码-第二卷-加入团队", rule: "被李弈从网吧捞出加入团队（约第85-90章）", status: "triggered" },
    { name: "王代码-第123章-切断数据", rule: "猎巫篇中察觉异常切断数据传输", status: "triggered" },
    { name: "张德全-第2章-见证起点", rule: "红星表厂被收购，见证奇迹起点", status: "triggered" },
    { name: "陈默-第114章-潜入504", rule: "以完美技术员身份潜入504厂", status: "triggered" },
    { name: "陈默-第123章-被发现", rule: "异常外传流量被王代码发现", status: "triggered" },
    { name: "陈默-第126章-叛逃", rule: "身份暴露后撤离至纽约WCA总部", status: "triggered" },
  ];

  for (const event of arcEvents) {
    plotlines.push({
      id: generateId(event.name),
      name: event.name,
      rule: event.rule,
      trigger: event.trigger || "",
      status: event.status,
      created_at: now,
      updated_at: now,
    });
  }

  // 5. 最终补丁 - 帕金森暗线动态伏笔规则
  plotlines.push({
    id: generateId("帕金森暗线动态伏笔规则"),
    name: "帕金森暗线动态伏笔规则",
    rule: "伏笔植入期：写手Agent随时可在高压、疲惫或精细活间隙随机掉落伏笔细节（藏手进袖子、吞白色药片、旱烟袋压住微颤虎口）。引爆期：严格等待作者手动指令（预计第175章）。",
    trigger: "作者手动指令",
    status: "untriggered",
    created_at: now,
    updated_at: now,
  });

  // 6. 最终补丁 - 前两卷角色登场定位
  plotlines.push({
    id: generateId("前两卷角色登场定位"),
    name: "前两卷角色登场定位",
    rule: "赵光约第65-70章首次登场（硅谷归国被拒，被李弈忽悠进厂）。王代码约第85-90章（原黑吧大神，被顺手捞走解决服务器黑危机）。",
    trigger: "",
    status: "triggered",
    created_at: now,
    updated_at: now,
  });

  return plotlines;
}

function parseDeprecated(content: string): Deprecated[] {
  const deprecated: Deprecated[] = [];
  const now = new Date().toISOString();

  // 已废弃/已进化设定
  deprecated.push({
    id: generateId("5000万一个月期限"),
    name: "5000万一个月期限",
    content: "第一卷",
    reason: "已进化：第一卷结束后系统升级，不再有固定期限和固定金额约束",
    created_at: now,
    updated_at: now,
  });

  deprecated.push({
    id: generateId("系统V1.0亏损1:1转化"),
    name: "系统V1.0亏损1:1转化",
    content: "",
    reason: "已进化：第三卷升级为V3.0，商业亏损归零，科研亏损1:2",
    created_at: now,
    updated_at: now,
  });

  deprecated.push({
    id: generateId("红星=机械表厂"),
    name: "红星=机械表厂",
    content: "",
    reason: "已进化：红星已扩展为横跨制造、互联网、物流、芯片的商业帝国",
    created_at: now,
    updated_at: now,
  });

  return deprecated;
}

async function main() {
  console.log("📖 读取角色圣经文件...");
  const content = readBibleFile();
  console.log(`✅ 文件读取成功，内容长度: ${content.length} 字符`);

  // 解析数据
  console.log("\n🔍 解析数据...");
  const characters = parseCharacters(content);
  const settings = parseSettings(content);
  const plotlines = parsePlotlines(content);
  const deprecated = parseDeprecated(content);

  console.log(`   - 角色: ${characters.length}个`);
  console.log(`   - 设定: ${settings.length}个`);
  console.log(`   - 约束/弧线: ${plotlines.length}条`);
  console.log(`   - 废弃设定: ${deprecated.length}个`);

  // 连接数据库
  console.log("\n🗄️ 连接数据库...");
  const filePath = getDbFilePath();
  ensureDir(path.dirname(filePath));
  const { DatabaseSync } = loadSqlite();
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA journal_mode = WAL;");

  // 清空旧数据
  console.log("\n🧹 清空旧数据...");
  db.exec("DELETE FROM characters;");
  db.exec("DELETE FROM settings;");
  db.exec("DELETE FROM plotlines;");
  db.exec("DELETE FROM deprecated;");
  console.log("   - 已清空所有表");

  // 导入角色
  console.log("\n📥 导入角色...");
  for (const char of characters) {
    db.prepare(`
      INSERT INTO characters(id, name, age_appearance, background, personality, speaking_style, catchphrase, current_location, current_status, default_inject, locked, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      char.id, char.name, char.age_appearance, char.background, char.personality, char.speaking_style, char.catchphrase, char.current_location, char.current_status, char.default_inject, char.locked, char.created_at, char.updated_at
    );
  }
  console.log(`   ✅ 角色（characters）: ${characters.length}个`);
  for (const char of characters) {
    console.log(`      - ${char.name}`);
  }

  // 导入设定
  console.log("\n📦 导入设定...");
  for (const setting of settings) {
    db.prepare(`
      INSERT INTO settings(id, name, description, status, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?)
    `).run(setting.id, setting.name, setting.description, setting.status, setting.created_at, setting.updated_at);
  }
  console.log(`   ✅ 设定（settings）: ${settings.length}个`);
  for (const setting of settings) {
    console.log(`      - ${setting.name}`);
  }

  // 导入约束/弧线
  console.log("\n📐 导入约束/弧线...");
  for (const plotline of plotlines) {
    db.prepare(`
      INSERT INTO plotlines(id, name, rule, trigger, status, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?, ?)
    `).run(plotline.id, plotline.name, plotline.rule, plotline.trigger, plotline.status, plotline.created_at, plotline.updated_at);
  }
  console.log(`   ✅ 约束/弧线（plotlines）: ${plotlines.length}条`);
  for (const plotline of plotlines) {
    console.log(`      - ${plotline.name}`);
  }

  // 导入废弃设定
  console.log("\n🗑️ 导入废弃设定...");
  for (const dep of deprecated) {
    db.prepare(`
      INSERT INTO deprecated(id, name, content, reason, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?)
    `).run(dep.id, dep.name, dep.content, dep.reason, dep.created_at, dep.updated_at);
  }
  console.log(`   ✅ 废弃设定（deprecated）: ${deprecated.length}个`);
  for (const dep of deprecated) {
    console.log(`      - ${dep.name}`);
  }

  // 汇总
  const total = characters.length + settings.length + plotlines.length + deprecated.length;
  console.log("\n" + "=".repeat(50));
  console.log("📊 总计导入记录:");
  console.log(`   ✅ 角色（characters）: ${characters.length}个`);
  console.log(`   ✅ 设定（settings）: ${settings.length}个`);
  console.log(`   ✅ 约束/弧线（plotlines）: ${plotlines.length}条`);
  console.log(`   ✅ 废弃设定（deprecated）: ${deprecated.length}个`);
  console.log(`   📊 总计: ${total}条记录`);
  console.log("=".repeat(50));
  console.log("\n🎉 导入完成！");
}

main().catch(console.error);
