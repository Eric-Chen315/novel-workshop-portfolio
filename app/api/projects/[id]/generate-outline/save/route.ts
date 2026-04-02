import { NextResponse } from "next/server";
import { loadOutline, saveOutline } from "@/lib/storage/knowledgeStore";

type SaveOutlineRequest = {
  volumeNum: number;
  volumeTitle: string;
  chapters: any[];
};

function buildRawContent(ch: any) {
  const lines: string[] = [];
  lines.push(`第${ch.chapterNum}章《${ch.title}》`);
  if (ch.corePurpose) lines.push(`\n【核心功能】\n${ch.corePurpose}`);
  if (Array.isArray(ch.plotPoints) && ch.plotPoints.length) {
    lines.push(`\n【情节点】`);
    lines.push(...ch.plotPoints.map((p: string, i: number) => `${i + 1}. ${p}`));
  }
  if (Array.isArray(ch.keyCharacters) && ch.keyCharacters.length) {
    lines.push(`\n【关键角色】\n${ch.keyCharacters.join("、")}`);
  }
  if (ch.emotionalArc) lines.push(`\n【情绪弧线】\n${ch.emotionalArc}`);
  if (ch.endHook) lines.push(`\n【章末钩子】\n${ch.endHook}`);
  if (ch.connectionToPrev) lines.push(`\n【与上一章衔接】\n${ch.connectionToPrev}`);
  if (ch.connectionToNext) lines.push(`\n【为下一章埋线】\n${ch.connectionToNext}`);
  if (Array.isArray(ch.mustInclude) && ch.mustInclude.length) {
    lines.push(`\n【必须包含】\n${ch.mustInclude.map((x: string) => `- ${x}`).join("\n")}`);
  }
  if (ch.wordCountGuide) lines.push(`\n【字数建议】\n${ch.wordCountGuide}`);
  return lines.join("\n");
}

// 计算章节范围并更新卷名
function updateVolumeTitle(title: string, chapters: any[]): string {
  if (!chapters || chapters.length === 0) return title;
  
  const chapterNums = chapters.map(ch => ch.chapterNum).filter(n => typeof n === 'number');
  if (chapterNums.length === 0) return title;
  
  const minChapter = Math.min(...chapterNums);
  const maxChapter = Math.max(...chapterNums);
  
  // 移除已有的章节范围（如 "（172-206章）"）
  const baseTitle = title.replace(/（\d+-\d+章）$/, '').trim();
  
  // 附加新的章节范围
  return `${baseTitle}（${minChapter}-${maxChapter}章）`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  let body: SaveOutlineRequest;
  try {
    body = (await request.json()) as SaveOutlineRequest;
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const { volumeNum, volumeTitle, chapters } = body;
  if (!volumeNum || !volumeTitle || !Array.isArray(chapters)) {
    return NextResponse.json({ error: "缺少必要参数：volumeNum, volumeTitle, chapters" }, { status: 400 });
  }

  const outline = loadOutline(projectId) as any;
  if (!outline.volumes) outline.volumes = [];

  const mappedChapters = chapters.map((ch) => {
    return {
      chapterNum: ch.chapterNum,
      title: ch.title,
      rawContent: buildRawContent(ch),
      plotSummary: ch.corePurpose || "",
      mustInclude: Array.isArray(ch.mustInclude) ? ch.mustInclude : [],
      connectionToNext: ch.connectionToNext || "",
      status: "pending",
    };
  });

  const idx = (outline.volumes as any[]).findIndex((v) => v?.volumeNum === volumeNum);
  
  if (idx >= 0) {
    // 卷已存在，追加章节
    const existingVolume = outline.volumes[idx];
    const existingChapters = existingVolume.chapters || [];
    
    // 创建现有章节的Map用于去重
    const existingChapterMap = new Map();
    existingChapters.forEach((ch: any) => {
      existingChapterMap.set(ch.chapterNum, ch);
    });
    
    // 用新章节覆盖或添加
    mappedChapters.forEach(newCh => {
      existingChapterMap.set(newCh.chapterNum, newCh);
    });
    
    // 转换为数组并按chapterNum升序排列
    const mergedChapters = Array.from(existingChapterMap.values())
      .sort((a: any, b: any) => a.chapterNum - b.chapterNum);
    
    // 更新卷标题，附加章节范围
    const updatedTitle = updateVolumeTitle(volumeTitle, mergedChapters);
    
    // 更新卷数据
    outline.volumes[idx] = {
      ...existingVolume,
      title: updatedTitle,
      chapters: mergedChapters,
    };
    
    outline.updatedAt = new Date().toISOString();
    saveOutline(projectId, outline);

    const minChapter = Math.min(...mergedChapters.map((c: any) => c.chapterNum));
    const maxChapter = Math.max(...mergedChapters.map((c: any) => c.chapterNum));
    return NextResponse.json({ 
      success: true, 
      message: `已保存${mappedChapters.length}章细纲（第${minChapter}-${maxChapter}章）`,
      totalChapters: mergedChapters.length
    });
  } else {
    // 卷不存在，新建卷
    // 更新卷标题，附加章节范围
    const finalTitle = updateVolumeTitle(volumeTitle, mappedChapters);
    
    const volumeRecord = {
      volumeNum,
      title: finalTitle,
      summary: "",
      chapters: mappedChapters,
    };

    outline.volumes.push(volumeRecord);
    outline.updatedAt = new Date().toISOString();
    saveOutline(projectId, outline);

    const minChapter = Math.min(...mappedChapters.map((c: any) => c.chapterNum));
    const maxChapter = Math.max(...mappedChapters.map((c: any) => c.chapterNum));
    return NextResponse.json({ 
      success: true, 
      message: `已保存${mappedChapters.length}章细纲（第${minChapter}-${maxChapter}章）`,
      totalChapters: mappedChapters.length
    });
  }
}
