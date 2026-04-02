#!/usr/bin/env tsx
/**
 * 章节批量导入脚本
 * 用法: npx tsx scripts/importChapters.ts --project <projectId> --file <txtFilePath>
 */

import * as fs from 'fs';
import * as path from 'path';

// ── 命令行参数解析 ──────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  let projectId = '';
  let filePath = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project' && i + 1 < args.length) {
      projectId = args[++i];
    } else if (args[i] === '--file' && i + 1 < args.length) {
      filePath = args[++i];
    }
  }

  return { projectId, filePath };
}

// ── 文件读取（自动处理 UTF-8 / GBK 编码）──────────────────────────────────
function readFileWithEncoding(filePath: string): string {
  const buffer = fs.readFileSync(filePath);

  // 先尝试 UTF-8
  const utf8Text = buffer.toString('utf-8');

  // 简单判断是否有乱码（\uFFFD 是 Unicode 替换字符，UTF-8 解码出现乱码时会出现）
  if (!utf8Text.includes('\uFFFD')) {
    return utf8Text;
  }

  // 尝试 GBK（Node.js 内置不支持 GBK，使用 latin1 + 手动转换）
  // 借助 TextDecoder（Node.js 内置，支持 GBK）
  try {
    const decoder = new TextDecoder('gbk');
    return decoder.decode(buffer);
  } catch {
    // 如果 GBK 也失败，返回 UTF-8 结果
    return utf8Text;
  }
}

// ── 章节标题正则：第X章（阿拉伯数字）+ 空格 + 标题 ──────────────────────
// 需求要求：/^第(\d+)章\s+(.+)$/m
const CHAPTER_TITLE_REGEX = /^第(\d+)章[\s　]+(.+)$/;

function isChapterTitle(line: string): { num: number; title: string } | null {
  const trimmed = line.trim();
  const match = trimmed.match(CHAPTER_TITLE_REGEX);
  if (!match) return null;
  return {
    num: parseInt(match[1], 10),
    // 完整标题保留原始行（含"第X章 标题"）
    title: trimmed,
  };
}

// ── 解析章节内部内容：分离正文 / 作者有话说 / 下章预告 ────────────────────
interface ParsedChapter {
  content: string;
  authorNote: string;
  preview: string;
}

function parseChapterBody(body: string): ParsedChapter {
  let remaining = body;
  let authorNote = '';
  let preview = '';

  // 1. 先提取"下章预告"或"下集预告"（从其出现位置到末尾）
  //    格式: "下章预告：内容" 或 "下集预告：内容" 或 "下章预告\n内容"
  const previewMatch = remaining.match(/(?:下章预告|下集预告)[：:：]?([\s\S]*)$/m);
  if (previewMatch) {
    preview = previewMatch[1].trim();
    remaining = remaining.slice(0, previewMatch.index).trimEnd();
  }

  // 2. 提取"作者有话说"（从其出现位置到后续内容）
  //    格式: "作者有话说\n内容" 或 "作者有话说：内容"
  const authorMatch = remaining.match(/作者有话说[：:：]?([\s\S]*)$/m);
  if (authorMatch) {
    authorNote = authorMatch[1].trim();
    remaining = remaining.slice(0, authorMatch.index).trimEnd();
  }

  return {
    content: remaining.trim(),
    authorNote,
    preview,
  };
}

// ── 字数统计（去除空白字符）────────────────────────────────────────────────
function countWords(text: string): number {
  return text.replace(/\s/g, '').length;
}

// ── 按章节拆分 TXT 文本 ─────────────────────────────────────────────────────
interface ChapterData {
  num: number;
  title: string;
  content: string;
  authorNote: string;
  preview: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

function splitIntoChapters(text: string): ChapterData[] {
  const lines = text.split(/\r?\n/);
  const now = new Date().toISOString();
  const chapters: ChapterData[] = [];

  let currentNum = 0;
  let currentTitle = '';
  let currentLines: string[] = [];

  function flushChapter() {
    if (!currentTitle) return;
    const body = currentLines.join('\n');
    const parsed = parseChapterBody(body);
    chapters.push({
      num: currentNum,
      title: currentTitle,
      content: parsed.content,
      authorNote: parsed.authorNote,
      preview: parsed.preview,
      wordCount: countWords(parsed.content),
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const line of lines) {
    const chapterInfo = isChapterTitle(line);
    if (chapterInfo) {
      // 遇到新章节标题，先保存上一章
      flushChapter();
      currentNum = chapterInfo.num;
      currentTitle = chapterInfo.title;
      currentLines = [];
    } else if (currentTitle) {
      // 在当前章节内容里累积行
      currentLines.push(line);
    }
    // 在第一个章节标题之前的内容忽略（前言、序等）
  }

  // 保存最后一章
  flushChapter();

  return chapters;
}

// ── 主流程 ──────────────────────────────────────────────────────────────────
async function main() {
  const { projectId, filePath } = parseArgs();

  if (!projectId || !filePath) {
    console.error('用法: npx tsx scripts/importChapters.ts --project <projectId> --file <txtFilePath>');
    console.error('示例: npx tsx scripts/importChapters.ts --project d0ca5fae-df9e-48f1-96b0-566087c5cd94 --file "D:/小说/第100-152章.txt"');
    process.exit(1);
  }

  // 解析为绝对路径
  const absoluteFilePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(absoluteFilePath)) {
    console.error(`错误: 文件不存在：${absoluteFilePath}`);
    process.exit(1);
  }

  console.log(`读取文件：${absoluteFilePath}`);

  // 读取并解码
  const text = readFileWithEncoding(absoluteFilePath);

  // 调试：打印总行数和前10行
  const allLines = text.split(/\r?\n/);
  console.log(`\n总行数: ${allLines.length}`);
  console.log('前10行:');
  allLines.slice(0, 10).forEach((line, i) => console.log(`  ${i}: ${line}`));

  // 调试：打印所有匹配到的章节标题行
  console.log('\n匹配到的章节标题行:');
  allLines.forEach((line, i) => {
    const info = isChapterTitle(line);
    if (info) {
      console.log(`  行${i+1}: 第${info.num}章 ${info.title}`);
    }
  });

  // 拆分章节
  const chapters = splitIntoChapters(text);

  if (chapters.length === 0) {
    console.error('错误：未检测到章节，请确保文件包含"第XX章 标题"格式的章节标题（XX 必须是阿拉伯数字）');
    process.exit(1);
  }

  console.log(`\n共检测到 ${chapters.length} 章\n`);

  // 确保目标目录存在
  // 脚本在 novel-workshop/scripts/ 下，data 目录在 novel-workshop/data/
  // 使用 process.argv[1] 获取脚本自身路径，比 import.meta.url 更兼容 tsx
  const scriptFile = process.argv[1];
  const scriptDir = path.dirname(path.resolve(scriptFile));
  const projectRoot = path.resolve(scriptDir, '..');
  const chaptersDir = path.join(projectRoot, 'data', 'projects', projectId, 'chapters');

  if (!fs.existsSync(chaptersDir)) {
    fs.mkdirSync(chaptersDir, { recursive: true });
    console.log(`创建目录：${chaptersDir}`);
  }

  // 逐章导入
  let successCount = 0;
  for (const chapter of chapters) {
    const chapterFilePath = path.join(chaptersDir, `${chapter.num}.json`);
    try {
      fs.writeFileSync(chapterFilePath, JSON.stringify(chapter, null, 2), 'utf-8');
      console.log(`✓ 第${chapter.num}章 ${chapter.title.replace(/^第\d+章[\s　]+/, '')} (${chapter.wordCount}字)`);
      successCount++;
    } catch (err) {
      console.error(`✗ 第${chapter.num}章 写入失败：${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n导入完成，共导入 ${successCount} 章`);
}

main().catch((err) => {
  console.error('脚本执行失败：', err);
  process.exit(1);
});
