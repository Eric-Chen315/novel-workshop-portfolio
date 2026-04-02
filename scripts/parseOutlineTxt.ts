// scripts/parseOutlineTxt.ts
// 用法: npx tsx scripts/parseOutlineTxt.ts <txt文件路径> <outline.json路径>
// 示例: npx tsx scripts/parseOutlineTxt.ts "./第四卷扩充细纲.txt" "./data/projects/xxx/knowledge/outline.json"

import fs from 'fs';
import path from 'path';

// ==================== 配置 ====================
const VOLUME = 4;
const KEEP_CHAPTERS_BELOW = 200; // 保留 outline.json 中小于此章节号的数据
// =============================================

interface ChapterOutline {
  chapterNum: number;
  title: string;
  volume: number;
  summary: string;          // 【核心功能】
  rawContent: string;       // 【情节点】
  keyCharacters: string;    // 【关键角色】
  emotionalArc: string;     // 【情绪弧线】
  chapterHook: string;      // 【章末钩子】
  connectionToPrev: string; // 【与上一章衔接】
  foreshadowing: string;    // 【为下一章埋线】
  mustInclude: string[];    // 【必须包含】
  suggestedWordCount: number; // 【字数建议】
  connectionToNext: string; // = chapterHook（兼容旧字段）
  status: string;
}

// ==================== 所有标记（按你 txt 的实际格式）====================
const MARKERS = [
  '【核心功能】',
  '【情节点】',
  '【关键角色】',
  '【情绪弧线】',
  '【章末钩子】',
  '【与上一章衔接】',
  '【为下一章埋线】',
  '【必须包含】',
  '【字数建议】',
];

// ==================== 工具函数 ====================

/**
 * 提取某个标记到下一个最近标记之间的全部文本
 */
function extractSection(text: string, marker: string): string {
  const startIdx = text.indexOf(marker);
  if (startIdx === -1) return '';

  const contentStart = startIdx + marker.length;

  // 找到 contentStart 之后最近的下一个标记
  let nearestEnd = text.length;
  for (const m of MARKERS) {
    if (m === marker) continue;
    const idx = text.indexOf(m, contentStart);
    if (idx !== -1 && idx < nearestEnd) {
      nearestEnd = idx;
    }
  }

  // 也要检查下一章的标题作为终止符（理论上不需要，因为已按章分块）
  return text.substring(contentStart, nearestEnd).trim();
}

/**
 * 从文本中提取数字（用于字数建议）
 */
function extractNumber(text: string): number {
  const match = text.match(/(\d{3,5})/);
  return match ? parseInt(match[1], 10) : 3000;
}

/**
 * 将 mustInclude 文本拆分为数组
 */
function parseMustInclude(text: string): string[] {
  if (!text) return [];

  const lines = text.split(/\n/);
  const items: string[] = [];

  for (const line of lines) {
    let cleaned = line
      .replace(/^\s*[\d]+[.、)）]\s*/, '')   // "1. ", "1、"
      .replace(/^\s*[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '') // "①"
      .replace(/^\s*[-•·*]\s*/, '')           // "- ", "• "
      .trim();

    if (cleaned.length > 0) {
      items.push(cleaned);
    }
  }

  // 回退：如果只有1条且很长，按顿号/分号二次拆
  if (items.length === 1 && items[0].length > 60) {
    const subItems = items[0].split(/[、；;]/).map(s => s.trim()).filter(s => s.length > 0);
    if (subItems.length >= 3) return subItems;
  }

  return items;
}

// ==================== 章节分割 ====================

function splitIntoChapterBlocks(fullText: string): Map<number, string> {
  const chapters = new Map<number, string>();

  // 匹配 "第XXX章" 或 "第XXX章：" 或 "第XXX章 "
  const chapterRegex = /(?=第\s*(\d+)\s*章[：:\s])/g;
  const matches = [...fullText.matchAll(chapterRegex)];

  if (matches.length === 0) {
    console.error('❌ 未找到任何 "第X章" 格式的章节标题');
    process.exit(1);
  }

  for (let i = 0; i < matches.length; i++) {
    const chapterNum = parseInt(matches[i][1], 10);
    const start = matches[i].index!;
    const end = i + 1 < matches.length ? matches[i + 1].index! : fullText.length;
    chapters.set(chapterNum, fullText.substring(start, end));
  }

  return chapters;
}

// ==================== 单章解析 ====================

function parseChapterBlock(block: string, chapterNum: number): ChapterOutline {
  // 提取标题
  const titleMatch = block.match(/第\s*\d+\s*章[：:\s]*(.+?)(?:\s*\n)/);
  const title = titleMatch ? titleMatch[1].trim() : `第${chapterNum}章`;

  const summary       = extractSection(block, '【核心功能】');
  const rawContent     = extractSection(block, '【情节点】');
  const keyCharacters  = extractSection(block, '【关键角色】');
  const emotionalArc   = extractSection(block, '【情绪弧线】');
  const chapterHook    = extractSection(block, '【章末钩子】');
  const connectionToPrev = extractSection(block, '【与上一章衔接】');
  const foreshadowing  = extractSection(block, '【为下一章埋线】');
  const mustIncludeRaw = extractSection(block, '【必须包含】');
  const wordCountRaw   = extractSection(block, '【字数建议】');

  const mustInclude = parseMustInclude(mustIncludeRaw);
  const suggestedWordCount = extractNumber(wordCountRaw || '3000');

  return {
    chapterNum,
    title,
    volume: VOLUME,
    summary,
    rawContent,
    keyCharacters,
    emotionalArc,
    chapterHook,
    connectionToPrev,
    foreshadowing,
    mustInclude,
    suggestedWordCount,
    connectionToNext: chapterHook, // 兼容旧字段
    status: 'pending',
  };
}

// ==================== 主程序 ====================

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('用法: npx tsx scripts/parseOutlineTxt.ts <txt文件路径> <outline.json路径>');
    console.error('示例: npx tsx scripts/parseOutlineTxt.ts "./第四卷扩充细纲.txt" "./outline.json"');
    process.exit(1);
  }

  const txtPath = path.resolve(args[0]);
  const jsonPath = path.resolve(args[1]);

  // ---- 1. 读取 txt ----
  console.log(`\n📖 读取: ${txtPath}`);
  if (!fs.existsSync(txtPath)) {
    console.error(`❌ 文件不存在: ${txtPath}`);
    process.exit(1);
  }
  const fullText = fs.readFileSync(txtPath, 'utf-8');
  console.log(`   文件大小: ${fullText.length} 字符`);

  // ---- 2. 分割章节 ----
  const chapterBlocks = splitIntoChapterBlocks(fullText);
  const chapterNums = [...chapterBlocks.keys()].sort((a, b) => a - b);
  console.log(`📑 识别到 ${chapterBlocks.size} 个章节: ${chapterNums[0]} ~ ${chapterNums[chapterNums.length - 1]}`);

  // ---- 3. 逐章解析 ----
  const parsedChapters: ChapterOutline[] = [];
  const warnings: string[] = [];

  for (const [num, block] of chapterBlocks) {
    const chapter = parseChapterBlock(block, num);
    parsedChapters.push(chapter);

    // 质量检查
    if (chapter.rawContent.length < 100) {
      warnings.push(`⚠️  第${num}章「${chapter.title}」rawContent 仅 ${chapter.rawContent.length} 字符`);
    }
    if (chapter.mustInclude.length < 2) {
      warnings.push(`⚠️  第${num}章「${chapter.title}」mustInclude 仅 ${chapter.mustInclude.length} 条`);
    }
    if (!chapter.summary) {
      warnings.push(`⚠️  第${num}章「${chapter.title}」缺少【核心功能】`);
    }
  }

  parsedChapters.sort((a, b) => a.chapterNum - b.chapterNum);

  // ---- 4. 读取 outline.json 并合并 ----
  console.log(`\n📂 读取: ${jsonPath}`);
  let outlineData: any = {};

  if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf-8');
    outlineData = JSON.parse(raw);

    // 备份
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const backupPath = `${jsonPath}.backup_${timestamp}`;
    fs.writeFileSync(backupPath, raw, 'utf-8');
    console.log(`   备份至: ${backupPath}`);
  } else {
    console.log('   outline.json 不存在，将创建新文件');
  }

  // 适配数据结构
  let targetChapters: any[] = [];
  let writeBack: (merged: any[]) => void;

  if (outlineData.volumes && Array.isArray(outlineData.volumes)) {
    const vol = outlineData.volumes.find((v: any) =>
      v.volume === VOLUME || v.volumeNumber === VOLUME
    );
    if (vol) {
      targetChapters = vol.chapters || [];
      writeBack = (merged) => { vol.chapters = merged; };
    } else {
      // 该卷不存在，新建
      const newVol = { volume: VOLUME, chapters: [] as any[] };
      outlineData.volumes.push(newVol);
      targetChapters = [];
      writeBack = (merged) => { newVol.chapters = merged; };
    }
  } else if (outlineData.chapters && Array.isArray(outlineData.chapters)) {
    targetChapters = outlineData.chapters.filter((ch: any) => ch.volume === VOLUME);
    const otherChapters = outlineData.chapters.filter((ch: any) => ch.volume !== VOLUME);
    writeBack = (merged) => {
      outlineData.chapters = [...otherChapters, ...merged].sort((a: any, b: any) => a.chapterNum - b.chapterNum);
    };
  } else {
    outlineData = { chapters: [] as any[] };
    targetChapters = [];
    writeBack = (merged) => { outlineData.chapters = merged; };
  }

  // 保留不动的章节 + 新解析的章节
  const kept = targetChapters.filter((ch: any) => ch.chapterNum < KEEP_CHAPTERS_BELOW);
  console.log(`   保留旧章节 ${kept.length} 章（< 第${KEEP_CHAPTERS_BELOW}章）`);

  const merged = [...kept, ...parsedChapters].sort((a: any, b: any) => a.chapterNum - b.chapterNum);
  writeBack(merged);

  // ---- 5. 写入 ----
  fs.writeFileSync(jsonPath, JSON.stringify(outlineData, null, 2), 'utf-8');
  console.log(`\n✅ 写入完成！第${VOLUME}卷共 ${merged.length} 章`);

  // ---- 6. 诊断报告 ----
  console.log('\n' + '='.repeat(70));
  console.log('  诊断报告');
  console.log('='.repeat(70));

  // 连续性检查
  for (let i = 1; i < parsedChapters.length; i++) {
    const prev = parsedChapters[i - 1].chapterNum;
    const curr = parsedChapters[i].chapterNum;
    if (curr !== prev + 1) {
      warnings.push(`❌ 章节不连续: 第${prev}章 → 第${curr}章（缺 ${curr - prev - 1} 章）`);
    }
  }

  // 表格
  console.log('\n章节 | 标题           | rawContent | mustInclude | summary | hook | 状态');
  console.log('-----|----------------|------------|-------------|---------|------|-----');
  for (const ch of parsedChapters) {
    const rc = ch.rawContent.length;
    const rcFlag = rc < 300 ? '⚠️' : '✓';
    const mi = ch.mustInclude.length;
    const miFlag = mi < 3 ? '⚠️' : '✓';
    const sm = ch.summary.length > 0 ? '✓' : '✗';
    const hk = ch.chapterHook.length > 0 ? '✓' : '✗';
    console.log(
      ` ${String(ch.chapterNum).padStart(3)} | ${ch.title.substring(0, 14).padEnd(14)} | ${String(rc).padStart(5)} ${rcFlag.padEnd(2)} | ${String(mi).padStart(4)} ${miFlag.padEnd(4)} | ${sm.padStart(4)}    | ${hk.padStart(4)} |`
    );
  }

  // 警告
  if (warnings.length > 0) {
    console.log(`\n⚠️  警告 (${warnings.length}):`);
    for (const w of warnings) {
      console.log(`  ${w}`);
    }
  } else {
    console.log('\n✅ 全部章节解析完整，无警告');
  }

  // ---- 7. 抽样验证 ----
  const sampleNums = [200, 216, 230, 246];
  console.log('\n' + '-'.repeat(50));
  console.log('  抽样验证');
  console.log('-'.repeat(50));
  for (const num of sampleNums) {
    const ch = parsedChapters.find(c => c.chapterNum === num);
    if (!ch) {
      console.log(`\n第${num}章: 未找到`);
      continue;
    }
    console.log(`\n第${num}章「${ch.title}」:`);
    console.log(`  rawContent (${ch.rawContent.length}字): ${ch.rawContent.substring(0, 80)}...`);
    console.log(`  mustInclude (${ch.mustInclude.length}条): ${JSON.stringify(ch.mustInclude)}`);
    console.log(`  章末钩子: ${ch.chapterHook.substring(0, 60)}${ch.chapterHook.length > 60 ? '...' : ''}`);
    console.log(`  字数建议: ${ch.suggestedWordCount}`);
  }

  console.log('\n🎉 完成！');
}

main();
