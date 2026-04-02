/**
 * 修复章节标题脚本
 * 
 * 功能：
 * 1. 读取 outline.json 获取章节标题映射
 * 2. 遍历 chapters 目录下所有 JSON 文件
 * 3. 如果 title 只是 "第XXX章"（无实际标题），从 outline 中补充完整标题
 * 4. 如果 outline 中也没有，尝试从 content 第一行提取
 * 5. 打印修复报告
 * 
 * 运行方式：npx tsx scripts/fixChapterTitles.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// 项目根目录（novel-workshop）
const projectRoot = path.join(__dirname, '..');
const projectId = 'd0ca5fae-df9e-48f1-96b0-566087c5cd94';

const chaptersDir = path.join(projectRoot, 'data', 'projects', projectId, 'chapters');
const outlinePath = path.join(projectRoot, 'data', 'projects', projectId, 'knowledge', 'outline.json');

// 从内容中提取章节标题
function extractTitleFromContent(content: string, chapterNum: number): string | null {
  if (!content) return null;
  
  const firstLine = content.split('\n')[0].trim();
  // 匹配 "第X章 XXX" 或 "第XX章：XXX" 等格式
  const match = firstLine.match(/^第(\d+)章[\s:：]+(.+)/);
  
  if (match && parseInt(match[1], 10) === chapterNum) {
    return `第${match[1]}章 ${match[2].trim()}`;
  }
  
  return null;
}

// 检查标题是否只是默认格式（无实际标题）
function isDefaultTitle(title: string, chapterNum: number): boolean {
  // 匹配 "第XXX章" 这种默认格式（没有实际标题内容）
  return title === `第${chapterNum}章` || title === `第 ${chapterNum} 章`;
}

async function main() {
  console.log('='.repeat(60));
  console.log('章节标题修复脚本');
  console.log('='.repeat(60));
  
  // 1. 读取 outline.json 获取章节标题映射
  console.log('\n[1/4] 读取大纲数据...');
  
  let outlineData: any;
  try {
    const outlineContent = fs.readFileSync(outlinePath, 'utf-8');
    outlineData = JSON.parse(outlineContent);
  } catch (error) {
    console.error('❌ 读取大纲失败:', error);
    process.exit(1);
  }
  
  // 构建章节号 -> 标题的映射
  const outlineTitleMap = new Map<number, string>();
  if (outlineData.volumes) {
    for (const volume of outlineData.volumes) {
      if (volume.chapters) {
        for (const chapter of volume.chapters) {
          if (chapter.chapterNum && chapter.title) {
            outlineTitleMap.set(chapter.chapterNum, chapter.title);
          }
        }
      }
    }
  }
  
  console.log(`   找到 ${outlineTitleMap.size} 个大纲章节标题`);
  
  // 2. 获取所有章节文件
  console.log('\n[2/4] 扫描章节文件...');
  
  const chapterFiles = fs.readdirSync(chaptersDir)
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => {
      const numA = parseInt(a.replace('.json', ''), 10);
      const numB = parseInt(b.replace('.json', ''), 10);
      return numA - numB;
    });
  
  console.log(`   找到 ${chapterFiles.length} 个章节文件`);
  
  // 3. 检查并修复标题
  console.log('\n[3/4] 检查并修复标题...\n');
  
  const report = {
    total: chapterFiles.length,
    fixed: 0,
    alreadyOk: 0,
    noFixNeeded: 0,
    errors: [] as string[],
    details: [] as { chapter: number; oldTitle: string; newTitle: string; source: string }[]
  };
  
  for (const file of chapterFiles) {
    const chapterPath = path.join(chaptersDir, file);
    const chapterNum = parseInt(file.replace('.json', ''), 10);
    
    try {
      const chapterData = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));
      const currentTitle = chapterData.title || '';
      const content = chapterData.content || '';
      
      // 检查是否需要修复
      let newTitle = currentTitle;
      let fixSource = '';
      
      if (isDefaultTitle(currentTitle, chapterNum)) {
        // 尝试从大纲获取标题
        const outlineTitle = outlineTitleMap.get(chapterNum);
        if (outlineTitle) {
          newTitle = `第${chapterNum}章 ${outlineTitle}`;
          fixSource = '大纲';
        } else {
          // 尝试从内容第一行提取
          const contentTitle = extractTitleFromContent(content, chapterNum);
          if (contentTitle) {
            newTitle = contentTitle;
            fixSource = '正文';
          }
        }
        
        if (newTitle !== currentTitle) {
          // 修复标题
          chapterData.title = newTitle;
          fs.writeFileSync(chapterPath, JSON.stringify(chapterData, null, 2), 'utf-8');
          report.fixed++;
          report.details.push({
            chapter: chapterNum,
            oldTitle: currentTitle,
            newTitle: newTitle,
            source: fixSource || '无来源'
          });
          console.log(`   ✅ 第${chapterNum}章: "${currentTitle}" -> "${newTitle}" (来源: ${fixSource || '未知'})`);
        } else {
          report.noFixNeeded++;
          console.log(`   ⏭️  第${chapterNum}章: 无可用标题，跳过`);
        }
      } else {
        report.alreadyOk++;
        console.log(`   ✓  第${chapterNum}章: 标题正常 "${currentTitle}"`);
      }
    } catch (error) {
      const errorMsg = `第${chapterNum}章处理失败: ${error}`;
      report.errors.push(errorMsg);
      console.error(`   ❌ ${errorMsg}`);
    }
  }
  
  // 4. 打印修复报告
  console.log('\n' + '='.repeat(60));
  console.log('修复报告');
  console.log('='.repeat(60));
  console.log(`总章节数: ${report.total}`);
  console.log(`✅ 已修复: ${report.fixed}`);
  console.log(`✓  正常: ${report.alreadyOk}`);
  console.log(`⏭️  无需修复: ${report.noFixNeeded}`);
  console.log(`❌ 错误: ${report.errors.length}`);
  
  if (report.errors.length > 0) {
    console.log('\n错误详情:');
    for (const err of report.errors) {
      console.log(`  - ${err}`);
    }
  }
  
  if (report.fixed > 0) {
    console.log('\n修复详情:');
    for (const detail of report.details) {
      console.log(`  第${detail.chapter}章: "${detail.oldTitle}" -> "${detail.newTitle}" (${detail.source})`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('修复完成！');
  console.log('='.repeat(60));
}

main().catch(console.error);
