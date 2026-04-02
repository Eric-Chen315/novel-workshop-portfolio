export interface Project {
  id: string;             // uuid
  title: string;          // 作品标题
  genre: string;          // 类型：玄幻/都市/科幻/言情/悬疑/历史/其他
  targetWordCount: number; // 目标字数
  synopsis: string;       // 作品简介
  styleDescription: string; // 文风说明
  tags: string[];         // 标签
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// 项目类型
export type ProjectGenre = '玄幻' | '都市' | '科幻' | '言情' | '悬疑' | '历史' | '游戏' | '末世' | '其他';

// 目标字数 - 对象格式
export interface ProjectTargetWords {
  total: number;      // 总目标字数
  perChapter: number; // 每章字数
}

// 项目元信息（用于列表和详情）
export interface ProjectMeta {
  id: string;
  title: string;
  genre: ProjectGenre;
  targetWords: ProjectTargetWords;
  targetWordCount?: number; // 兼容旧字段
  synopsis: string;
  styleDescription: string;
  tags?: string[];
  coverUrl?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}
