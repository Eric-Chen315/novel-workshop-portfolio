export interface Character {
  id: string;
  name: string;
  role: '主角' | '主要配角' | '次要配角' | '反派' | '路人';
  gender?: string;
  appearance: string;     // 外貌
  personality: string;    // 性格特征
  speechStyle: string;    // 语言习惯
  background: string;     // 背景故事
  currentState: string;   // 当前状态（随剧情更新）
  relationships: { targetId: string; type: string; note: string }[];
  updatedAt: string;
  // 扩展字段
  aliases?: string;        // 别名
  behaviorRules?: string; // 行为铁律
  growthArc?: string;     // 成长弧光
  sampleDialogue?: string; // 典型对话
  keyEvents?: string;     // 关键事件
}
