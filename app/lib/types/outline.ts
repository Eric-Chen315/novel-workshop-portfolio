export interface OutlineVolume {
  id: string;
  title: string;          // 卷名
  summary: string;        // 卷简介
  chapters: OutlineChapter[];
}

export interface OutlineChapter {
  id: string;
  chapterNum: number;
  title: string;
  summary: string;        // 一句话概要
  rawContent?: string;
  mustInclude?: string[];
  connectionToPrev?: string;
  connectionToNext?: string;
  status: '未开始' | '草稿中' | '已完成' | '需修改';
}
