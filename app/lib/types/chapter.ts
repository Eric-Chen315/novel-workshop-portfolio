export interface Chapter {
  chapterNum: number;
  title: string;
  content: string;
  wordCount: number;
  status: '未开始' | '草稿中' | '已完成';
  createdAt: string;
  updatedAt: string;
}