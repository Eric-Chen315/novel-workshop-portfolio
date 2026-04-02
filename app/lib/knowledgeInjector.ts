import { loadCharacters, loadWorldbuilding } from './storage/knowledgeStore';
import { getProjectMetaPath } from './storage/projectStore';
import { getBibleCoreSummary } from './bible/bibleService';
import { formatFactsAsConstraints, loadFacts } from './factsManager';
import { loadLatestStates, formatStateForInjection } from './chapterStateManager';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import { getProjectDataPath } from './storage/dataRoot';
import { getGenderLabel } from './genderRules';

export interface InjectionContext {
  projectId: string;
  chapterDirection: string;
  chapterNo?: number;
  maxTokenBudget?: number;
}

export interface InjectedPrompt {
  systemPromptAddition: string;
  injectedItems: string[];
}

// 从项目级 SQLite 读取角色圣经数据
function getProjectBibleData(projectId: string) {
  const dbPath = getProjectDataPath(projectId, 'knowledge', 'bible.sqlite');
  
  if (!fs.existsSync(dbPath)) {
    return { characters: [], globalRules: [], worldSettings: [] };
  }
  
  try {
    const db = new Database(dbPath, { readonly: true });
    
    // 检查表是否存在
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const tableNames = tables.map(t => t.name);
    
    const result = {
      characters: [] as any[],
      globalRules: [] as any[],
      worldSettings: [] as any[]
    };
    
    // 读取 characters 表
    if (tableNames.includes('characters')) {
      result.characters = db.prepare("SELECT * FROM characters ORDER BY createdAt DESC").all();
    }
    
    // 读取 global_rules 表（按 priority 降序）
    if (tableNames.includes('global_rules')) {
      result.globalRules = db.prepare("SELECT * FROM global_rules ORDER BY priority DESC").all();
    }
    
    // 读取 world_settings 表
    if (tableNames.includes('world_settings')) {
      result.worldSettings = db.prepare("SELECT * FROM world_settings ORDER BY createdAt DESC").all();
    }
    
    db.close();
    return result;
  } catch (error) {
    console.error('读取项目圣经数据失败:', error);
    return { characters: [], globalRules: [], worldSettings: [] };
  }
}

// 构建项目级角色圣经注入内容
function buildProjectCharacterBible(projectId: string, chapterDirection: string): string {
  const { characters, globalRules, worldSettings } = getProjectBibleData(projectId);
  
  let content = '';
  
  // 1. 角色数据
  if (characters.length > 0) {
    content += '=== 角色圣经（项目数据库） ===\n\n';
    
    // 根据章节方向过滤相关角色
    const relatedCharacters = characters.filter((char: any) => 
      chapterDirection.includes(char.name) || char.role === '主角'
    );
    
    const charsToShow = relatedCharacters.length > 0 ? relatedCharacters : characters.slice(0, 3);
    
    for (const char of charsToShow) {
      content += `【${char.name}】\n`;
      if (char.aliases) content += `- 别名: ${char.aliases}\n`;
      if (char.gender || getGenderLabel(char.name)) content += `- 性别: ${char.gender || getGenderLabel(char.name)}\n`;
      if (char.role) content += `- 角色: ${char.role}\n`;
      if (char.appearance) content += `- 外貌: ${char.appearance}\n`;
      if (char.background) content += `- 背景: ${char.background}\n`;
      if (char.personality) content += `- 性格: ${char.personality}\n`;
      if (char.speechStyle) content += `- 语言风格: ${char.speechStyle}\n`;
      if (char.behaviorRules) content += `- 行为铁律: ${char.behaviorRules}\n`;
      if (char.growthArc) content += `- 成长弧光: ${char.growthArc}\n`;
      if (char.currentStatus) content += `- 当前状态: ${char.currentStatus}\n`;
      if (char.sampleDialogue) content += `- 典型对话: ${char.sampleDialogue}\n`;
      if (char.keyEvents) content += `- 关键事件: ${char.keyEvents}\n`;
      content += '\n';
    }
  }
  
  // 2. 全局规则（按 priority 降序）
  if (globalRules.length > 0) {
    content += '=== 全局规则（必须遵守） ===\n\n';
    for (const rule of globalRules) {
      content += `【${rule.title}】\n`;
      content += `${rule.content}\n\n`;
    }
  }
  
  // 3. 世界设定
  if (worldSettings.length > 0) {
    content += '=== 世界设定 ===\n\n';
    for (const setting of worldSettings) {
      content += `【${setting.name}】\n`;
      if (setting.category) content += `- 类别: ${setting.category}\n`;
      if (setting.volume) content += `- 卷册: ${setting.volume}\n`;
      if (setting.description) content += `- 描述: ${setting.description}\n`;
      if (setting.currentStatus) content += `- 当前状态: ${setting.currentStatus}\n`;
      content += '\n';
    }
  }
  
  return content;
}

// 检查是否为硬编码兜底内容
function isFallbackContent(content: string): boolean {
  const fallback = '【角色圣经·核心摘要（写手与审核共用）】';
  return content.includes(fallback);
}

// 从章节文件中提取最后3000字尾部内容和标题
function getChapterEnding(projectId: string, chapterNo: number): { title: string; ending: string } | null {
  try {
    const chapterPath = getProjectDataPath(projectId, 'chapters', `${chapterNo}.json`);
    if (!fs.existsSync(chapterPath)) return null;
    
    const chapterData = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));
    const content = chapterData.content || '';
    const title = chapterData.title || `第${chapterNo}章`;
    if (!content) return null;
    
    // 取最后3000字
    return {
      title,
      ending: content.slice(-3000)
    };
  } catch {
    return null;
  }
}

function getChapterContent(projectId: string, chapterNo: number): { title: string; content: string } | null {
  try {
    const chapterPath = getProjectDataPath(projectId, 'chapters', `${chapterNo}.json`);
    if (!fs.existsSync(chapterPath)) return null;

    const chapterData = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));
    const content = chapterData.content || '';
    const title = chapterData.title || `第${chapterNo}章`;
    if (!content) return null;

    return { title, content };
  } catch {
    return null;
  }
}

function extractPreviewSection(content: string): string {
  if (!content) return '';

  const markers = ['【下集预告】', '【下章预告】', '下集预告', '下章预告', '预告'];
  let startIndex = -1;

  for (const marker of markers) {
    const index = content.lastIndexOf(marker);
    if (index !== -1 && index > startIndex) {
      startIndex = index;
    }
  }

  if (startIndex === -1) return '';

  return content.slice(startIndex).trim();
}

function cleanPreview(text: string): string {
  const patterns = [
    /求.*?五星.*?好评/g,
    /求.*?追读/g,
    /求.*?月票/g,
    /求.*?推荐票/g,
    /求.*?打赏/g,
    /求.*?收藏/g,
    /稳定.*?日更.*?不断更/g,
    /日更.*?不断/g,
    /感谢.*?支持/g,
    /跪求.*?支持/g,
    /各位.*?给个.*?[票赏藏读评]/g,
    /新书.*?求.*?[票赏藏读评]/g,
  ];

  let cleaned = text;
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

function hasMeaningfulPreviewContent(text: string): boolean {
  if (!text) return false;

  const stripped = text
    .replace(/【下集预告】|【下章预告】|下集预告|下章预告/g, '')
    .replace(/[\p{P}\p{S}\s]/gu, '')
    .trim();

  return stripped.length > 0;
}

// 章节边界锁定模块（最高优先级，不参与 token 裁剪）
function buildChapterLockSection(
  projectId: string,
  chapterNo?: number
): { lockSection: string; injectedItems: string[] } {
  const injectedItems: string[] = [];
  let lockSection = '';

  if (!chapterNo) {
    return { lockSection: '', injectedItems: [] };
  }

  try {
    const outlinePath = getProjectDataPath(projectId, 'knowledge', 'outline.json');

    if (!fs.existsSync(outlinePath)) {
      return { lockSection: '', injectedItems: [] };
    }

    const outlineData = JSON.parse(fs.readFileSync(outlinePath, 'utf-8'));
    if (!outlineData.volumes) {
      return { lockSection: '', injectedItems: [] };
    }

    // 查找当前章节、上一章、下一章
    let currentChapter = null;
    let prevChapter = null;
    let nextChapter = null;
    let globalConstraints: string[] = [];

    // 先收集全局约束
    if (outlineData.globalConstraints && Array.isArray(outlineData.globalConstraints)) {
      globalConstraints = outlineData.globalConstraints.filter((c: string) => c && c.trim());
    }

    // 使用 flatMap 查找所有章节，用 chapterNum 直接匹配
    const allChapters = outlineData.volumes.flatMap((v: any) => v.chapters || []);
    const idx = allChapters.findIndex((c: any) => c.chapterNum === chapterNo);
    if (idx >= 0) {
      currentChapter = allChapters[idx];
      prevChapter = idx > 0 ? allChapters[idx - 1] : null;
      nextChapter = idx < allChapters.length - 1 ? allChapters[idx + 1] : null;
    }

    if (!currentChapter) {
      return { lockSection: '', injectedItems: [] };
    }

    // 构建锁定指令
    lockSection += '=== 📌 章节写作锁定指令（最高优先级，违反即为失败） ===\n\n';
    lockSection += `【当前章节】第${currentChapter.chapterNum}章：${currentChapter.title}\n\n`;

    // 本章细纲
    lockSection += `【本章细纲（必须严格遵循）】\n`;
    if (currentChapter.rawContent) {
      lockSection += currentChapter.rawContent + '\n';
    } else if (currentChapter.plotSummary) {
      lockSection += currentChapter.plotSummary + '\n';
    }
    lockSection += '\n';

    // 硬性边界规则
    lockSection += `【硬性边界规则】
1. 你只能写第${currentChapter.chapterNum}章的内容，严禁涉及后续章节的情节
2. 本章必须覆盖细纲中列出的所有"主要情节"点
3. 本章的"章末钩子"必须作为最后的收束场景，不得在此之后继续推进剧情
4. 如果细纲中有"SOP对标"信息，参考对应SOP的节奏但不要照搬
5. 禁止提前揭示、暗示、或展开任何属于第${currentChapter.chapterNum + 1}章及之后的情节

`;

    // 上一章概要
    lockSection += '【上一章概要（用于衔接）】\n';
    if (prevChapter) {
      const prevContent = prevChapter.rawContent || prevChapter.plotSummary || '';
      lockSection += `第${prevChapter.chapterNum}章 ${prevChapter.title}：${prevContent.slice(0, 200)}...\n`;
    } else {
      lockSection += '无\n';
    }
    lockSection += '\n';

    // 情绪状态摘要（前一章尾部3000字）
    if (prevChapter) {
      lockSection += '【前一章情绪收束状态】\n';
      lockSection += `基于第${prevChapter.chapterNum}章"${prevChapter.title}"的结尾，当前各角色/场景的情绪状态：\n`;
      lockSection += '- 请从前一章尾部内容中推断并延续以下状态：\n';
      lockSection += '1. 团队整体士气/氛围\n';
      lockSection += '2. 主角李弈的心理状态\n';
      lockSection += '3. 尚未解决的悬念/冲突\n';
      lockSection += '4. 本章开篇必须自然承接的情绪基调\n';
      
      // 读取前一章的章节文件获取最后3000字
      try {
        const prevChapterPath = getProjectDataPath(projectId, 'chapters', `${prevChapter.chapterNum}.json`);
        if (fs.existsSync(prevChapterPath)) {
          const prevChapterData = JSON.parse(fs.readFileSync(prevChapterPath, 'utf-8'));
          const prevContent = prevChapterData.content || '';
          if (prevContent) {
            const last3000 = prevContent.slice(-3000);
            lockSection += `\n【上一章结尾片段（请注意其中的未解决悬念和叙事承诺）】\n${last3000}\n\n`;
            lockSection += '【重要】如果上述结尾中存在悬念（如某人到来、未揭晓的信息、紧张场景中断等），本章必须在开头段落中予以回应或交代。\n';
          }
        }
      } catch (e) {
        console.error('获取前一章情绪状态失败:', e);
      }
      lockSection += '\n';

      try {
        const previousChapterFile = getChapterContent(projectId, prevChapter.chapterNum);
        const previousChapterPreview = previousChapterFile
          ? cleanPreview(extractPreviewSection(previousChapterFile.content))
          : '';

        if (previousChapterPreview && hasMeaningfulPreviewContent(previousChapterPreview)) {
          lockSection += '【上一章下集预告】\n';
          lockSection += `${previousChapterPreview}\n\n`;
          lockSection += '【衔接要求】本章开头必须在前500字内回应上述预告中的核心场景和人物。如果本章大纲方向与预告存在冲突，优先在开头回应预告承诺，再过渡到本章主线。\n\n';
        }
      } catch (e) {
        console.error('提取上一章下集预告失败:', e);
      }
    }

    // 下一章预告
    lockSection += '【下一章预告（仅用于铺垫语气，禁止展开）】\n';
    if (nextChapter) {
      const nextContent = nextChapter.rawContent || nextChapter.plotSummary || '';
      lockSection += `第${nextChapter.chapterNum}章 ${nextChapter.title}：${nextContent.slice(0, 100)}...\n`;
    } else {
      lockSection += '无\n';
    }
    lockSection += '\n';

    lockSection += '=== 锁定指令结束 ===\n\n';

    // 全局约束
    if (globalConstraints.length > 0) {
      lockSection += '=== 全局约束 ===\n';
      globalConstraints.forEach((constraint: string) => {
        lockSection += `- ${constraint}\n`;
      });
      lockSection += '=== 全局约束结束 ===\n\n';
    }

    injectedItems.push(`章节锁定：第${currentChapter.chapterNum}章`);
    if (globalConstraints.length > 0) {
      injectedItems.push(`全局约束（${globalConstraints.length}条）`);
    }

    return { lockSection, injectedItems };
  } catch (e) {
    console.error('加载章节锁定模块失败:', e);
    return { lockSection: '', injectedItems: [] };
  }
}

export async function buildKnowledgeContext(ctx: InjectionContext): Promise<InjectedPrompt> {
  const { projectId, chapterDirection, chapterNo, maxTokenBudget = 6000 } = ctx;
  
  // 1. 章节边界锁定模块（最高优先级）
  const { lockSection: chapterLockSection, injectedItems: lockItems } = buildChapterLockSection(projectId, chapterNo);
  
  const injectedItems: string[] = [...lockItems];
  let context = chapterLockSection;

  // 1.5 本章禁区（防止信息泄露和角色抢跑）
  try {
    const outlinePath = getProjectDataPath(projectId, 'knowledge', 'outline.json');
    if (fs.existsSync(outlinePath) && chapterNo) {
      const outlineData = JSON.parse(fs.readFileSync(outlinePath, 'utf-8'));
      
      let nextChapterOutline: { chapterNum: number; title?: string; plotPoints?: string[]; keyCharacters?: string[]; endHook?: string } | null = null;
      let currentChapterOutline: { chapterNum: number; keyCharacters?: string[]; endHook?: string } | null = null;
      
      for (const vol of outlineData.volumes || []) {
        for (const ch of (vol.chapters || [])) {
          if (ch.chapterNum === chapterNo) currentChapterOutline = ch;
          if (ch.chapterNum === chapterNo + 1) nextChapterOutline = ch;
        }
      }
      
      const forbiddenLines: string[] = [];
      
      // 下一章的核心内容是本章的禁区
      if (nextChapterOutline) {
        forbiddenLines.push(`以下内容属于第${chapterNo + 1}章"${nextChapterOutline.title || ''}"，本章绝对不得提前揭露或暗示：`);
        if (nextChapterOutline.plotPoints && nextChapterOutline.plotPoints.length > 0) {
          const topPoints = nextChapterOutline.plotPoints.slice(0, 3);
          for (const point of topPoints) {
            forbiddenLines.push(`- 禁止涉及：${typeof point === 'string' ? point.substring(0, 80) : String(point).substring(0, 80)}`);
          }
        }
        if (nextChapterOutline.endHook) {
          forbiddenLines.push(`- 禁止提前揭露下章悬念：${String(nextChapterOutline.endHook).substring(0, 80)}`);
        }
      }
      
      // 当前章keyCharacters限制
      if (currentChapterOutline && currentChapterOutline.keyCharacters && currentChapterOutline.keyCharacters.length > 0) {
        forbiddenLines.push('');
        forbiddenLines.push(`【角色出场铁律】本章允许出场的角色仅限：${currentChapterOutline.keyCharacters.join('、')}。`);
        forbiddenLines.push('除上述角色外，任何其他角色都不得在本章出现。不得有台词、不得有动作描写、不得有视角段落、不得有内心独白。');
        forbiddenLines.push('即便前文中已经出现的常驻角色（如团队成员），如果不在上述名单中，本章也绝对不可让其出场或说话。');
        forbiddenLines.push('如果剧情需要表达分析或推理，全部由keyCharacters中的角色独自完成，不得借用未授权角色之口。');
      }
      
      if (forbiddenLines.length > 0) {
        context += '=== 本章禁区（绝对不可违反） ===\n\n';
        context += forbiddenLines.join('\n');
        context += '\n\n=== 本章禁区结束 ===\n\n';
        injectedItems.push('本章禁区');
      }
    }
  } catch (e) {
    console.error('构建本章禁区失败:', e);
    injectedItems.push('本章禁区: 构建失败');
  }

  // 角色状态注入
  try {
    if (chapterNo) {
      const latestStates = loadLatestStates(projectId, chapterNo, 3);
      if (latestStates.length > 0) {
        const stateText = formatStateForInjection(latestStates);
        context += '\n\n' + stateText;
        injectedItems.push(`角色状态追踪(${latestStates.length}个角色)`);
      }
    }
  } catch (e) {
    console.warn('[知识注入] 角色状态加载失败，跳过:', e);
  }
  
  // 2. 作品元数据
  try {
    const metaPath = getProjectMetaPath(projectId);
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    context += `=== 作品设定 ===\n作品简介：${meta.synopsis || '无'}\n文风要求：${meta.styleDescription || '无'}\n\n`;
    injectedItems.push('作品设定');
  } catch {
    injectedItems.push('作品设定: 获取失败');
  }
  
  // 2. 角色数据 - 优先从项目级 SQLite 数据库读取
  try {
    const projectBibleContent = buildProjectCharacterBible(projectId, chapterDirection);
    
    if (projectBibleContent) {
      context += `${projectBibleContent}\n\n`;
      injectedItems.push('角色圣经(项目数据库)');
    } else {
      // 兜底：尝试使用全局 Bible
      const bibleSummary = await getBibleCoreSummary();
      if (bibleSummary && !isFallbackContent(bibleSummary)) {
        context += `${bibleSummary}\n\n`;
        injectedItems.push('角色圣经(全局)');
      }
    }
  } catch (e) {
    console.error('获取角色圣经失败:', e);
    // 兜底：尝试从项目级 JSON 文件获取
    try {
      const characters = loadCharacters(projectId);
      if (characters.characters && characters.characters.length > 0) {
        const relatedCharacters = characters.characters.filter((char: { name: string }) => 
          chapterDirection.includes(char.name)
        );
        
        if (relatedCharacters.length > 0) {
          context += '=== 角色圣经 ===\n';
          relatedCharacters.forEach((char: { name: string; personality?: string; speakingStyle?: string; currentStatus?: string }) => {
            context += `${char.name} | 性格：${char.personality || '无'} | 语言习惯：${char.speakingStyle || '无'} | 当前状态：${char.currentStatus || '无'}\n`;
          });
          context += '\n';
          injectedItems.push('角色圣经(项目级)');
        }
      }
    } catch {
      injectedItems.push('角色圣经: 获取失败');
    }
  }
  
  // 3. facts.json 注入（创作铁律、不可逆事件、已揭示信息）
  try {
    const facts = await loadFacts(projectId);
    if (facts) {
      // 3.1 创作铁律（plotRules）- 优先级1，绝对不裁剪
      if (facts.plotRules && facts.plotRules.length > 0) {
        context += '=== 创作铁律（违反则本章作废） ===\n\n';
        facts.plotRules.forEach((rule, index) => {
          context += `${index + 1}. ${rule}\n`;
        });
        context += '\n';
        injectedItems.push(`创作铁律（${facts.plotRules.length}条）`);
      }
      
      // 3.2 不可逆事件（irreversibleEvents）
      const irreversibleEvents = facts.majorEvents.filter(e => e.irreversible);
      if (irreversibleEvents.length > 0) {
        context += '=== 不可逆事件（已发生，不可撤回） ===\n\n';
        irreversibleEvents.forEach(evt => {
          context += `- 卷${evt.volume}第${evt.chapter}章：${evt.event}\n`;
          if (evt.affectedCharacters && evt.affectedCharacters.length > 0) {
            context += `  影响角色：${evt.affectedCharacters.join('、')}\n`;
          }
        });
        context += '\n';
        injectedItems.push(`不可逆事件（${irreversibleEvents.length}条）`);
      }
      
      // 3.3 已揭示信息（revealedInfo）
      if (facts.revealedInfo && facts.revealedInfo.length > 0) {
        context += '=== 已揭示信息（读者已知，不可矛盾） ===\n\n';
        facts.revealedInfo.forEach(info => {
          context += `- 卷${info.volume}第${info.chapter}章：${info.info}\n`;
          if (info.note) {
            context += `  备注：${info.note}\n`;
          }
        });
        context += '\n';
        injectedItems.push(`已揭示信息（${facts.revealedInfo.length}条）`);
      }
    }
  } catch (e) {
    console.error('获取 facts.json 失败:', e);
    injectedItems.push('facts.json: 获取失败');
  }
  
  // 4. 世界观数据
  try {
    const worldbuilding = loadWorldbuilding(projectId);
    const worldbuildingFields = Object.entries(worldbuilding)
      .filter(([key, value]) => 
        !['updatedAt', 'blocksUpdatedAt'].includes(key) && 
        value && 
        typeof value === 'string' && 
        value.trim() !== ''
      );
    
    if (worldbuildingFields.length > 0) {
      context += '=== 世界观 ===\n';
      worldbuildingFields.forEach(([key, value]) => {
        const fieldName = {
          worldBackground: '世界背景',
          powerSystem: '力量体系',
          factions: '势力分布',
          locations: '地点设定',
          items: '物品设定',
          rulesAndTaboos: '规则与禁忌'
        }[key] || key;
        context += `${fieldName}：${value}\n`;
      });
      context += '\n';
      injectedItems.push(`世界观（${worldbuildingFields.length}个字段）`);
    }
  } catch (e) {
    console.error('获取世界观失败:', e);
    injectedItems.push('世界观: 获取失败');
  }
  
  // 4. 大纲数据 - 根据章节号定位上下文（跳过，因为章节锁定模块已处理）
  // 此处不再重复注入大纲上下文，避免冗余
  
  // 5. 前文衔接（最近5章各1500字尾部内容，参与token裁剪）
  if (chapterNo && chapterNo > 1) {
    try {
      const previousChapters: Array<{ chapterNum: number; title: string; ending: string }> = [];
      
      // 读取 chapterNum-1 到 chapterNum-5
      for (let i = Math.max(1, chapterNo - 5); i < chapterNo; i++) {
        const result = getChapterEnding(projectId, i);
        if (result) {
          previousChapters.push({
            chapterNum: i,
            title: result.title,
            ending: result.ending
          });
        }
      }
      
      // 按章节号从小到大排列
      previousChapters.sort((a, b) => a.chapterNum - b.chapterNum);
      
      if (previousChapters.length > 0) {
        context += '=== 前文衔接（用于保持风格和剧情连贯） ===\n\n';
        
        for (const chapter of previousChapters) {
          context += `【第${chapter.chapterNum}章 ${chapter.title}】（尾部摘录）\n`;
          context += `${chapter.ending}\n\n`;
        }
        
        context += '=== 前文衔接结束 ===\n\n';
        injectedItems.push(`前文衔接（${previousChapters.length}章）`);
      }
    } catch (e) {
      console.error('获取前文上下文失败:', e);
      injectedItems.push('前文衔接: 获取失败');
    }
  }
  
  // Token 预算检查和优先级裁剪
  const estimatedTokens = Math.floor(context.length * 1.5);
  if (estimatedTokens > maxTokenBudget) {
    // 优先级裁剪系统：按优先级从低到高裁剪
    // 优先级1（绝对不裁剪）：章节锁定、创作铁律
    // 优先级2（最后裁剪）：不可逆事件、已揭示信息
    // 优先级3（次要裁剪）：角色圣经、世界观
    // 优先级4（优先裁剪）：前文衔接
    
    // 分离各部分内容
    const sections: Array<{ content: string; priority: number; name: string }> = [];
    
    // 提取章节锁定部分（优先级1）
    const lockMatch = context.match(/(=== 📌 章节写作锁定指令[\s\S]*?=== 锁定指令结束 ===\n\n)/);
    const lockContent = lockMatch ? lockMatch[1] : '';
    
    // 提取全局约束（优先级1）
    const globalMatch = context.match(/(=== 全局约束 ===[\s\S]*?=== 全局约束结束 ===\n\n)/);
    const globalContent = globalMatch ? globalMatch[1] : '';
    
    // 提取创作铁律（优先级1）
    const rulesMatch = context.match(/(=== 创作铁律（违反则本章作废） ===[\s\S]*?\n\n)/);
    const rulesContent = rulesMatch ? rulesMatch[1] : '';
    
    // 提取作品设定（优先级2）
    const metaMatch = context.match(/(=== 作品设定 ===[\s\S]*?\n\n)/);
    const metaContent = metaMatch ? metaMatch[1] : '';
    
    // 提取不可逆事件（优先级2）
    const irreversibleMatch = context.match(/(=== 不可逆事件（已发生，不可撤回） ===[\s\S]*?\n\n)/);
    const irreversibleContent = irreversibleMatch ? irreversibleMatch[1] : '';
    
    // 提取已揭示信息（优先级2）
    const revealedMatch = context.match(/(=== 已揭示信息（读者已知，不可矛盾） ===[\s\S]*?\n\n)/);
    const revealedContent = revealedMatch ? revealedMatch[1] : '';
    
    // 提取角色圣经（优先级3）
    const bibleMatch = context.match(/(=== 角色圣经[\s\S]*?\n\n(?==== |$))/);
    const bibleContent = bibleMatch ? bibleMatch[1] : '';
    
    // 提取世界观（优先级3）
    const worldMatch = context.match(/(=== 世界观 ===[\s\S]*?\n\n)/);
    const worldContent = worldMatch ? worldMatch[1] : '';
    
    // 提取前文衔接（优先级4）
    const prevMatch = context.match(/(=== 前文衔接（用于保持风格和剧情连贯） ===[\s\S]*?=== 前文衔接结束 ===\n\n)/);
    const prevContent = prevMatch ? prevMatch[1] : '';
    
    // 构建优先级列表
    if (lockContent) sections.push({ content: lockContent, priority: 1, name: '章节锁定' });
    if (globalContent) sections.push({ content: globalContent, priority: 1, name: '全局约束' });
    if (rulesContent) sections.push({ content: rulesContent, priority: 1, name: '创作铁律' });
    if (metaContent) sections.push({ content: metaContent, priority: 2, name: '作品设定' });
    if (irreversibleContent) sections.push({ content: irreversibleContent, priority: 2, name: '不可逆事件' });
    if (revealedContent) sections.push({ content: revealedContent, priority: 2, name: '已揭示信息' });
    if (bibleContent) sections.push({ content: bibleContent, priority: 3, name: '角色圣经' });
    if (worldContent) sections.push({ content: worldContent, priority: 3, name: '世界观' });
    if (prevContent) sections.push({ content: prevContent, priority: 4, name: '前文衔接' });
    
    // 按优先级排序（优先级1最重要）
    sections.sort((a, b) => a.priority - b.priority);
    
    // 从优先级4开始裁剪
    let rebuiltContext = '';
    let currentTokens = 0;
    const trimmedSections: string[] = [];
    
    for (const section of sections) {
      const sectionTokens = Math.floor(section.content.length * 1.5);
      
      if (currentTokens + sectionTokens <= maxTokenBudget) {
        // 完整保留
        rebuiltContext += section.content;
        currentTokens += sectionTokens;
      } else if (section.priority === 1) {
        // 优先级1绝对不裁剪
        rebuiltContext += section.content;
        currentTokens += sectionTokens;
      } else {
        // 需要裁剪
        const remainingBudget = maxTokenBudget - currentTokens;
        if (remainingBudget > 500) {
          // 还有空间，部分保留
          const targetLength = Math.floor(remainingBudget / 1.5);
          const lines = section.content.split('\n');
          const trimmedLines = lines.slice(0, Math.floor(lines.length * targetLength / section.content.length));
          const trimmedContent = trimmedLines.join('\n') + '\n\n';
          rebuiltContext += trimmedContent;
          currentTokens += Math.floor(trimmedContent.length * 1.5);
          trimmedSections.push(`${section.name}(部分)`);
        } else {
          // 空间不足，完全舍弃
          trimmedSections.push(section.name);
        }
      }
    }
    
    context = rebuiltContext;
    if (trimmedSections.length > 0) {
      injectedItems.push(`(已裁剪: ${trimmedSections.join('、')})`);
    }
  }
  
  return {
    systemPromptAddition: context,
    injectedItems
  };
}

// ─── Jaccard 相似度检测 ───────────────────────────────────────────────────

// 中文停用词列表
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '和', '与', '或', '但', '也', '都', '就', '会', '能', '要',
  '把', '被', '让', '给', '从', '到', '对', '向', '为', '以', '而', '又', '却', '这',
  '那', '之', '其', '及', '于', '则', '乃', '至', '若', '如', '等', '着', '吗', '呢',
  '吧', '啊', '呀', '哦', '嗯', '哈', '啦', '嘛', '个', '们', '中', '里', '上', '下'
]);

// 将章节 rawContent 转换为情节要素集合
function extractPlotElements(rawContent: string): Set<string> {
  if (!rawContent) return new Set();
  
  // 按标点和空格分割
  const words = rawContent
    .replace(/[，。！？；：、""''（）《》【】\s]+/g, ' ')
    .split(' ')
    .filter(w => w.length >= 2) // 过滤长度 < 2 的词
    .filter(w => !STOP_WORDS.has(w)); // 过滤停用词
  
  return new Set(words);
}

// 计算两个章节的 Jaccard 相似度
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return intersection.size / union.size;
}

// 检测当前卷已有章节之间的套路雷同
interface PatternRepetition {
  chapterA: number;
  chapterB: number;
  similarity: number;
  sharedElements: string[];
}

function detectPatternRepetition(
  chapters: Array<{ chapterNumber: number; rawContent: string }>,
  threshold: number = 0.4
): PatternRepetition[] {
  const results: PatternRepetition[] = [];
  
  if (chapters.length < 2) return results;
  
  // 提取每个章节的情节要素
  const chapterElements = chapters.map(ch => ({
    chapterNumber: ch.chapterNumber,
    elements: extractPlotElements(ch.rawContent)
  }));
  
  // 两两比较
  for (let i = 0; i < chapterElements.length; i++) {
    for (let j = i + 1; j < chapterElements.length; j++) {
      const elementsA = chapterElements[i].elements;
      const elementsB = chapterElements[j].elements;
      
      const similarity = jaccardSimilarity(elementsA, elementsB);
      
      if (similarity >= threshold) {
        // 找出共有的高频关键词（取前5个）
        const intersection = [...elementsA].filter(x => elementsB.has(x));
        const sharedElements = intersection.slice(0, 5);
        
        results.push({
          chapterA: chapterElements[i].chapterNumber,
          chapterB: chapterElements[j].chapterNumber,
          similarity,
          sharedElements
        });
      }
    }
  }
  
  // 按相似度降序排列
  results.sort((a, b) => b.similarity - a.similarity);
  
  return results;
}

// ─── StoryGuard 上下文组装 ───────────────────────────────────────────────────

export async function assembleStoryGuardContext(
  projectId: string,
  targetVolume: number,
  targetChapterStart: number,
  _targetChapterEnd: number
): Promise<string> {
  const TOTAL_BUDGET = 18000; // 中文字符
  const layers: string[] = [];

  // ── Layer 1: 硬约束事实（无上限截断） ──
  let layer1 = '';
  try {
    layer1 = await formatFactsAsConstraints(projectId);
  } catch (e) {
    console.warn('[StoryGuard] Layer 1 获取失败:', e);
  }
  layers.push(layer1);

  const layer1Len = layer1.length;
  let remaining = TOTAL_BUDGET - layer1Len;
  if (remaining <= 0) {
    return layer1; // 硬约束本身已超预算（极端情况），直接返回
  }

  // ── Layer 3: 角色快照 ──
  const layer3Budget = Math.min(3000, Math.floor(remaining * 0.25));
  let layer3 = '';
  try {
    const dbPath = getProjectDataPath(projectId, 'knowledge', 'bible.sqlite');
    if (fs.existsSync(dbPath)) {
      const db = new Database(dbPath, { readonly: true });
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
      if (tables.some(t => t.name === 'characters')) {
        const chars = db.prepare("SELECT name, role, personality, currentStatus FROM characters ORDER BY createdAt").all() as {
          name: string; role: string; personality: string; currentStatus: string;
        }[];
        if (chars.length > 0) {
          const charLines = ['■ 角色快照'];
          for (const c of chars) {
            const line = `  ${c.name}(${c.role})：${(c.personality || '').slice(0, 60)}｜${(c.currentStatus || '').slice(0, 40)}`;
            charLines.push(line);
          }
          layer3 = charLines.join('\n');
          if (layer3.length > layer3Budget) {
            layer3 = layer3.slice(0, layer3Budget);
          }
        }
      }
      db.close();
    }
  } catch (e) {
    console.warn('[StoryGuard] Layer 3 获取失败:', e);
  }
  remaining -= layer3.length;

  // ── Layer 4: 套路检测警告（关键词匹配 + Jaccard 相似度） ──
  const layer4Budget = Math.min(2000, Math.floor(remaining * 0.15));
  let layer4 = '';
  try {
    const warnLines: string[] = ['■ 套路检测警告'];
    let hasWarnings = false;
    
    // 读取当前卷已有章节的 rawContent
    const outlinePath = getProjectDataPath(projectId, 'knowledge', 'outline.json');
    if (fs.existsSync(outlinePath)) {
      const outlineData = JSON.parse(fs.readFileSync(outlinePath, 'utf-8'));
      const allChapters: { chapterNumber: number; chapterNum: number; rawContent: string }[] = [];
      for (const vol of outlineData.volumes || []) {
        if (vol.volumeNum !== targetVolume) continue;
        for (const ch of vol.chapters || []) {
          if (ch.chapterNum < targetChapterStart && ch.rawContent) {
            allChapters.push({ 
              chapterNumber: ch.chapterNum, 
              chapterNum: ch.chapterNum, 
              rawContent: ch.rawContent 
            });
          }
        }
      }

      // 1. 关键词模式匹配
      const facts = await loadFacts(projectId);
      if (facts && facts.patternKeywords && Object.keys(facts.patternKeywords).length > 0) {
        const patternCounts: Record<string, { count: number; chapters: number[] }> = {};
        for (const [regex, label] of Object.entries(facts.patternKeywords)) {
          try {
            const re = new RegExp(regex, 'g');
            const matchedChapters: number[] = [];
            for (const ch of allChapters) {
              const matches = ch.rawContent.match(re);
              if (matches && matches.length > 0) {
                matchedChapters.push(ch.chapterNum);
              }
            }
            if (matchedChapters.length > 0) {
              patternCounts[label] = { 
                count: matchedChapters.length, 
                chapters: matchedChapters 
              };
            }
          } catch {
            // 正则无效，跳过
          }
        }

        // 超过2次的输出警告
        const keywordWarnings = Object.entries(patternCounts).filter(([, data]) => data.count > 2);
        if (keywordWarnings.length > 0) {
          hasWarnings = true;
          for (const [label, data] of keywordWarnings) {
            const chapterList = data.chapters.slice(0, 5).join('、');
            warnLines.push(`  [关键词匹配] "${label}" 模式已在本卷出现 ${data.count} 次（第${chapterList}章${data.chapters.length > 5 ? '等' : ''}），请避免继续使用`);
          }
        }
      }

      // 2. Jaccard 相似度检测
      if (allChapters.length >= 2) {
        const repetitions = detectPatternRepetition(allChapters, 0.4);
        if (repetitions.length > 0) {
          hasWarnings = true;
          // 只显示前3个最相似的章节对
          for (const rep of repetitions.slice(0, 3)) {
            const similarityPercent = (rep.similarity * 100).toFixed(0);
            const elements = rep.sharedElements.join('、');
            warnLines.push(`  [结构雷同] 第${rep.chapterA}章与第${rep.chapterB}章情节相似度 ${similarityPercent}%（共有要素：${elements}），建议差异化处理`);
          }
        }
      }
    }

    if (hasWarnings) {
      layer4 = warnLines.join('\n');
      if (layer4.length > layer4Budget) {
        layer4 = layer4.slice(0, layer4Budget);
      }
    }
  } catch (e) {
    console.warn('[StoryGuard] Layer 4 获取失败:', e);
  }
  remaining -= layer4.length;

  // ── Layer 2: 剧情摘要（弹性填充剩余空间） ──
  let layer2 = '';
  try {
    const outlinePath = getProjectDataPath(projectId, 'knowledge', 'outline.json');
    if (fs.existsSync(outlinePath)) {
      const outlineData = JSON.parse(fs.readFileSync(outlinePath, 'utf-8'));
      const summaryLines: string[] = ['■ 剧情摘要'];

      // 前一卷最后5章
      for (const vol of outlineData.volumes || []) {
        if (vol.volumeNum === targetVolume - 1) {
          const chs = (vol.chapters || [])
            .sort((a: { chapterNum: number }, b: { chapterNum: number }) => a.chapterNum - b.chapterNum);
          const last5 = chs.slice(-5);
          if (last5.length > 0) {
            summaryLines.push(`  [前卷末尾]`);
            for (const ch of last5) {
              const summary = ch.plotSummary || ch.rawContent?.slice(0, 80) || '';
              summaryLines.push(`  第${ch.chapterNum}章 ${ch.title}：${summary.slice(0, 80)}`);
            }
          }
        }
      }

      // 当前卷已有章节的 rawContent 前100字
      for (const vol of outlineData.volumes || []) {
        if (vol.volumeNum !== targetVolume) continue;
        const chs = (vol.chapters || [])
          .filter((c: { chapterNum: number }) => c.chapterNum < targetChapterStart)
          .sort((a: { chapterNum: number }, b: { chapterNum: number }) => a.chapterNum - b.chapterNum);
        if (chs.length > 0) {
          summaryLines.push(`  [本卷已有章节]`);
          for (const ch of chs) {
            const content = ch.rawContent || ch.plotSummary || '';
            summaryLines.push(`  第${ch.chapterNum}章 ${ch.title}：${content.slice(0, 100)}`);
          }
        }
      }

      layer2 = summaryLines.join('\n');
      if (layer2.length > remaining) {
        layer2 = layer2.slice(0, Math.max(0, remaining));
      }
    }
  } catch (e) {
    console.warn('[StoryGuard] Layer 2 获取失败:', e);
  }

  // ── 组装输出 ──
  const parts = [layer1, layer3, layer4, layer2].filter(Boolean);
  return parts.join('\n\n');
}
