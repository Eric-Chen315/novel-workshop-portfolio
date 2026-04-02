#!/usr/bin/env tsx
/**
 * 大纲整合脚本
 * 读取多个大纲TXT文件，整合为统一的outline.json
 * 
 * 用法: npx tsx scripts/mergeOutlines.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ── 源文件配置（按优先级从高到低）───────────────────────────────────────────
const SOURCE_FILES = [
  // 1. 第三卷后续章节细纲（第153-170章）
  'D:\\陈红义\\破局\\自由职业\\AI小说\\番茄小说\\《本想败光十个亿，结果成了教父》\\纲领\\第三卷\\第三卷后续章节细纲（第153-170章）.txt',
  // 2. 第九单元细纲 V3.0
  'D:\\陈红义\\破局\\自由职业\\AI小说\\番茄小说\\《本想败光十个亿，结果成了教父》\\纲领\\第三卷\\第九单元细纲 (V3.0 - 主编审校修订版).txt',
  // 3. 后续创作方向
  'D:\\陈红义\\破局\\自由职业\\AI小说\\番茄小说\\《本想败光十个亿，结果成了教父》\\纲领\\第三卷\\后续创作方向.txt',
  // 4. 小说中后期大纲整合手册
  'D:\\陈红义\\破局\\自由职业\\AI小说\\番茄小说\\《本想败光十个亿，结果成了教父》\\纲领\\小说中后期（第2-4卷）大纲整合手册.txt',
  // 5. 小说总体大纲
  'D:\\陈红义\\破局\\自由职业\\AI小说\\番茄小说\\《本想败光十个亿，结果成了教父》\\纲领\\小说总体大纲.txt',
];

// 输出路径
const OUTPUT_FILE = 'novel-workshop/data/projects/d0ca5fae-df9e-48f1-96b0-566087c5cd94/knowledge/outline.json';

// 已导入章节范围 - 番茄序号：第154-165章为已写完，第166-171章待写
// 细纲序号：第153-164章为已写完，第165-170章待写
const WRITTEN_CHAPTERS_END = 164;
const TOMATO_OFFSET = 1; // 番茄序号 = 细纲序号 + 1

// ── 文件读取（自动处理 UTF-8 / GBK 编码）──────────────────────────────────
function readFileWithEncoding(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    console.warn(`  文件不存在: ${filePath}`);
    return null;
  }

  const buffer = fs.readFileSync(filePath);

  // 先尝试 UTF-8
  const utf8Text = buffer.toString('utf-8');
  if (!utf8Text.includes('\uFFFD')) {
    return utf8Text;
  }

  // 尝试 GBK
  try {
    const decoder = new TextDecoder('gbk');
    return decoder.decode(buffer);
  } catch {
    return utf8Text;
  }
}

// ── 章节标题正则 ───────────────────────────────────────────────────────────
// 匹配格式：第153章：标题 或 **第153章：标题** 或 第153章 标题
const CHAPTER_TITLE_REGEX = /^\**\s*第(\d+)章[：:\s　]+(.+?)\s*\**$/gm;

interface ParsedChapter {
  chapterNum: number;
  title: string;
  plotSummary: string;
  keyCharacters: string[];
  emotionalArc: string;
  foreshadowing: string[];
  mustInclude: string[];
  mustNotInclude: string[];
  connectionToPrev: string;
  connectionToNext: string;
  status: 'pending' | 'written';
  source: string;
  rawContent: string;
}

// ── 从文件中解析章节 ───────────────────────────────────────────────────────
function parseChaptersFromFile(content: string, fileName: string): ParsedChapter[] {
  const chapters: ParsedChapter[] = [];
  const lines = content.split(/\r?\n/);
  
  let currentChapterNum = 0;
  let currentTitle = '';
  let currentContent: string[] = [];
  let inChapter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // 匹配各种格式的章节标题：第153章、**第153章**、第153章：标题等
    const match = line.match(/^\**\s*第(\d+)章[：:\s　]+(.+?)\s*\**$/);
    
    if (match) {
      // 保存上一章
      if (inChapter && currentChapterNum > 0) {
        const parsed = parseChapterContent(
          currentChapterNum,
          currentTitle,
          currentContent.join('\n'),
          fileName
        );
        if (parsed) chapters.push(parsed);
      }
      
      // 开始新章节
      currentChapterNum = parseInt(match[1], 10);
      currentTitle = match[2] || line;
      currentContent = [];
      inChapter = true;
    } else if (inChapter) {
      currentContent.push(lines[i]);
    }
  }

  // 保存最后一章
  if (inChapter && currentChapterNum > 0) {
    const parsed = parseChapterContent(
      currentChapterNum,
      currentTitle,
      currentContent.join('\n'),
      fileName
    );
    if (parsed) chapters.push(parsed);
  }

  return chapters;
}

// ── 解析章节内容 ───────────────────────────────────────────────────────────
function parseChapterContent(
  chapterNum: number,
  title: string,
  content: string,
  source: string
): ParsedChapter | null {
  // 提取关键信息
  const plotSummary = extractField(content, ['核心功能', '主要情节', '核心逻辑', '败家', '情节']);
  const keyCharacters = extractCharacters(content);
  const emotionalArc = extractField(content, ['情绪曲线', '关键词', '关键字']);
  const foreshadowing = extractList(content, ['章末钩子', '伏笔', '铺垫']);
  const mustInclude = extractList(content, ['核心功能', '必须包含']);
  const mustNotInclude: string[] = [];
  const connectionToPrev = extractField(content, ['承接', '衔接', '上章']);
  const connectionToNext = extractField(content, ['为下一章', '铺垫', '过渡']);

  // 判断状态
  const status: 'pending' | 'written' = chapterNum <= WRITTEN_CHAPTERS_END ? 'written' : 'pending';

  return {
    chapterNum,
    title: title.replace(/^第\d+章[\s　]+/, '').trim(),
    plotSummary: plotSummary.slice(0, 200), // 限制200字
    keyCharacters,
    emotionalArc,
    foreshadowing,
    mustInclude,
    mustNotInclude,
    connectionToPrev,
    connectionToNext,
    status,
    source,
    rawContent: content,
  };
}

// ── 辅助函数：从内容中提取字段 ───────────────────────────────────────────
function extractField(content: string, keywords: string[]): string {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[：:：]?(.+?)(?=\\n\\n|\\n[^\\s]|$)`, 's');
    const match = content.match(regex);
    if (match) {
      return match[1].trim().slice(0, 200);
    }
  }
  return '';
}

// ── 辅助函数：提取角色列表 ───────────────────────────────────────────────
function extractCharacters(content: string): string[] {
  const characters: string[] = [];
  const patterns = [
    /主要人物[：:：](.+?)(?=\n\n|\n[^丨]|$)/,
    /出场角色[：:：](.+?)(?=\n\n|\n[^丨]|$)/,
    /关键角色[：:：](.+?)(?=\n\n|\n[^丨]|$)/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      const names = match[1].split(/[,，、]/).map(s => s.trim()).filter(Boolean);
      characters.push(...names);
    }
  }

  // 常见角色名检测
  const commonCharacters = ['李弈', '魏莱', '赵疯子', '刘大爷', '王代码', '灰衣人', '马建国'];
  for (const char of commonCharacters) {
    if (content.includes(char) && !characters.includes(char)) {
      characters.push(char);
    }
  }

  return [...new Set(characters)];
}

// ── 辅助函数：提取列表 ───────────────────────────────────────────────────
function extractList(content: string, keywords: string[]): string[] {
  const results: string[] = [];
  
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[：:：]([\\s\\S]+?)(?=\\n\\n|\\n第|$)`, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const items = match[1].split(/[,，、\n]/).map(s => s.trim()).filter(Boolean);
      results.push(...items);
    }
  }

  return results.slice(0, 5); // 限制5条
}

// ── 从文件中提取全局约束 ─────────────────────────────────────────────────
function extractGlobalConstraints(content: string): string[] {
  const constraints: string[] = [];
  
  // 提取系统版本相关信息
  const v3Match = content.match(/V3\.0[^\n]*/g);
  if (v3Match) {
    constraints.push(...v3Match);
  }

  // 提取金手指规则
  const goldFingerMatch = content.match(/系统[vv]?\d+\.\d+[^\n]*/g);
  if (goldFingerMatch) {
    constraints.push(...goldFingerMatch);
  }

  // 提取核心约束
  const coreConstraints = [
    /不允许.*提前泄露/,
    /严禁.*提前/,
    /只能.*第.*卷.*才能/,
  ];
  
  for (const pattern of coreConstraints) {
    const match = content.match(pattern);
    if (match) {
      constraints.push(match[0]);
    }
  }

  return [...new Set(constraints)];
}

// ── 整合章节（V3.1补丁合并逻辑）────────────────────────────────────────────────
// 1. 先读取基础层（第三卷后续章节细纲）作为基础
// 2. 再读取补丁层（第九单元细纲V3.0），将补丁内容追加到基础层对应章节
// 3. 对于补丁中有但基础层没有的章节，直接新增
function mergeChaptersWithPatch(allChapters: ParsedChapter[][]): Map<number, ParsedChapter> {
  const chapterMap = new Map<number, ParsedChapter>();
  
  // 基础层：第三卷后续章节细纲（第153-170章）- 索引0
  const baseChapters = allChapters[0] || [];
  // 补丁层：第九单元细纲 V3.0 - 索引1
  const patchChapters = allChapters[1] || [];

  // 1. 先将基础层所有章节放入Map
  for (const chapter of baseChapters) {
    chapterMap.set(chapter.chapterNum, chapter);
  }

  // 2. 处理补丁层，合并到基础层对应章节
  for (const patchChapter of patchChapters) {
    const chapterNum = patchChapter.chapterNum;
    const baseChapter = chapterMap.get(chapterNum);

    if (baseChapter) {
      // 章节已存在，将补丁内容追加到rawContent后面
      const separator = '\n\n=== V3.1修订补丁 ===\n';
      const mergedRawContent = baseChapter.rawContent + separator + patchChapter.rawContent;
      
      // 更新字段（补丁层的内容会覆盖基础层）
      baseChapter.rawContent = mergedRawContent;
      baseChapter.plotSummary = patchChapter.plotSummary || baseChapter.plotSummary;
      baseChapter.mustInclude = patchChapter.mustInclude.length > 0 ? patchChapter.mustInclude : baseChapter.mustInclude;
      baseChapter.connectionToNext = patchChapter.connectionToNext || baseChapter.connectionToNext;
      baseChapter.source = `${baseChapter.source} + ${patchChapter.source}`;
    } else {
      // 章节不存在，直接新增
      chapterMap.set(chapterNum, patchChapter);
    }
  }

  return chapterMap;
}

// ── 兼容旧版本（如果只需要简单的覆盖逻辑）────────────────────────────────
function mergeChaptersSimple(allChapters: ParsedChapter[][]): Map<number, ParsedChapter> {
  const chapterMap = new Map<number, ParsedChapter>();

  // 按优先级遍历（从低到高，后面的覆盖前面的）
  for (let i = allChapters.length - 1; i >= 0; i--) {
    for (const chapter of allChapters[i]) {
      chapterMap.set(chapter.chapterNum, chapter);
    }
  }

  return chapterMap;
}

// ── 整理为卷结构 ─────────────────────────────────────────────────────────
function organizeIntoVolumes(chapters: Map<number, ParsedChapter>) {
  const volumes: Array<{
    volumeNum: number;
    title: string;
    summary: string;
    chapters: ParsedChapter[];
  }> = [];

  const sortedChapters = Array.from(chapters.values()).sort(
    (a, b) => a.chapterNum - b.chapterNum
  );

  // 按章节范围划分卷
  const volumeRanges = [
    { min: 1, max: 55, title: '第一卷：疯子起手，误成图腾' },
    { min: 56, max: 110, title: '第二卷：整顿职场，重塑规则' },
    { min: 111, max: 180, title: '第三卷：大国脊梁，凡人亦神' },
    { min: 181, max: 200, title: '第四卷：天道无亲，全球收割' },
  ];

  for (const range of volumeRanges) {
    const volumeChapters = sortedChapters.filter(
      c => c.chapterNum >= range.min && c.chapterNum <= range.max
    );

    if (volumeChapters.length > 0) {
      volumes.push({
        volumeNum: range.min === 1 ? 1 : range.min === 56 ? 2 : range.min === 111 ? 3 : 4,
        title: range.title,
        summary: getVolumeSummary(range.min),
        chapters: volumeChapters.map(c => ({
          // 应用番茄序号偏移：细纲序号 + 1 = 番茄实际序号
          chapterNum: c.chapterNum + TOMATO_OFFSET,
          title: c.title,
          plotSummary: c.plotSummary,
          keyCharacters: c.keyCharacters,
          emotionalArc: c.emotionalArc,
          foreshadowing: c.foreshadowing,
          mustInclude: c.mustInclude,
          mustNotInclude: c.mustNotInclude,
          connectionToPrev: c.connectionToPrev,
          connectionToNext: c.connectionToNext,
          status: c.status,
          source: c.source,
          rawContent: c.rawContent,
        })),
      });
    }
  }

  return volumes;
}

// ── 获取卷摘要 ───────────────────────────────────────────────────────────
function getVolumeSummary(volumeNum: number): string {
  const summaries: Record<number, string> = {
    1: '确立"李弈"神一般的人设。通过3个反直觉的小项目，从"败家子"变成"拥有神秘商业逻辑的天才"。',
    2: '从单一产品上升到公司管理模式和社会规则的碰撞。包括游戏公司、外卖物流、国潮文化三个单元。',
    3: '主角开始触碰芯片、农业、能源等硬科技领域。结合《天道》的救世主内核，实现"别人做不到的，我李弈做到了"。',
    4: '完结前的最后狂欢，拔高立意。华尔街联合围剿主角，最终主角散尽家财，成立人类未来基金。',
  };
  return summaries[volumeNum] || '';
}

// ── 主流程 ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(60));
  console.log('大纲整合脚本开始执行');
  console.log('='.repeat(60));

  const parsedFiles: Array<{ fileName: string; chapters: ParsedChapter[]; constraints: string[] }> = [];
  const globalConstraints: string[] = [];

  // 读取并解析每个文件
  for (let i = 0; i < SOURCE_FILES.length; i++) {
    const filePath = SOURCE_FILES[i];
    const fileName = path.basename(filePath);
    const priority = i + 1;
    
    console.log(`\n[${priority}/${SOURCE_FILES.length}] 读取: ${fileName}`);
    
    const content = readFileWithEncoding(filePath);
    if (!content) continue;

    const chapters = parseChaptersFromFile(content, fileName);
    const constraints = extractGlobalConstraints(content);

    parsedFiles.push({ fileName, chapters, constraints });
    globalConstraints.push(...constraints);

    console.log(`  解析到 ${chapters.length} 章, ${constraints.length} 条约束`);
  }

  // 打印解析报告
  console.log('\n' + '='.repeat(60));
  console.log('解析报告');
  console.log('='.repeat(60));
  
  for (const { fileName, chapters, constraints } of parsedFiles) {
    console.log(`  ${fileName}: ${chapters.length} 章, ${constraints.length} 约束`);
  }

  // 合并章节（使用V3.1补丁合并逻辑）
  const chapterArrays = parsedFiles.map(f => f.chapters);
  const mergedChapters = mergeChaptersWithPatch(chapterArrays);
  
  console.log(`\n整合后共 ${mergedChapters.size} 章`);

  // 统计状态
  let writtenCount = 0;
  let pendingCount = 0;
  for (const chapter of mergedChapters.values()) {
    if (chapter.status === 'written') writtenCount++;
    else pendingCount++;
  }
  console.log(`  - 已完成: ${writtenCount} 章 (1-${WRITTEN_CHAPTERS_END}章)`);
  console.log(`  - 待写作: ${pendingCount} 章 (${WRITTEN_CHAPTERS_END + 1}章及以后)`);

  // 整理为卷结构
  const volumes = organizeIntoVolumes(mergedChapters);

  // 构建输出JSON
  const output = {
    meta: {
      title: '《本想败光十个亿，结果成了教父》',
      mergedAt: new Date().toISOString(),
      sourceFiles: parsedFiles.map(f => f.fileName),
    },
    volumes,
    globalConstraints: [...new Set(globalConstraints)],
  };

  // 确保输出目录存在
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 写入文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✓ 输出文件: ${OUTPUT_FILE}`);

  // 打印各卷概览
  console.log('\n' + '='.repeat(60));
  console.log('卷概览');
  console.log('='.repeat(60));
  
  for (const vol of volumes) {
    const writtenChapters = vol.chapters.filter(c => c.status === 'written').length;
    const pendingChapters = vol.chapters.filter(c => c.status === 'pending').length;
    console.log(`  第${vol.volumeNum}卷 ${vol.title}`);
    console.log(`    - 总章节: ${vol.chapters.length}章 (已完成${writtenChapters}章, 待写${pendingChapters}章)`);
    if (vol.chapters.length > 0) {
      console.log(`    - 章节范围: 第${vol.chapters[0].chapterNum}章 - 第${vol.chapters[vol.chapters.length - 1].chapterNum}章`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('整合完成！');
  console.log('='.repeat(60));
}

main().catch((err) => {
  console.error('脚本执行失败:', err);
  process.exit(1);
});
