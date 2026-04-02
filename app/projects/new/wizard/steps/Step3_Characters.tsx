'use client';

import { useState, useRef, useEffect } from 'react';
import type { WizardStep3, WizardStep1, CharacterDraft } from '../hooks/useWizardState';

const ROLES: CharacterDraft['role'][] = ['主角', '主要配角', '次要配角', '反派', '路人'];

const ROLE_COLORS: Record<CharacterDraft['role'], string> = {
  主角: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
  主要配角: 'bg-green-100 dark:bg-green-900/60 text-green-700 dark:text-green-300',
  次要配角: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  反派: 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300',
  路人: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-500',
};

const TEXT_FIELDS: Array<{
  key: keyof CharacterDraft;
  label: string;
  placeholder: string;
  rows: number;
}> = [
  { key: 'appearance', label: '外貌描述', placeholder: '身高、体型、发色、标志性特征……', rows: 2 },
  {
    key: 'personality',
    label: '性格特点',
    placeholder: '核心性格特质（至多 3 个词 + 简短说明）',
    rows: 2,
  },
  {
    key: 'speechStyle',
    label: '语言风格',
    placeholder: '说话习惯、口头禅、语气特点……',
    rows: 2,
  },
  {
    key: 'behaviorRules',
    label: '行为铁律',
    placeholder: '该角色绝对不会做的事，或必然会做的事',
    rows: 2,
  },
  {
    key: 'growthArc',
    label: '成长弧线',
    placeholder: '角色在故事中的变化轨迹',
    rows: 2,
  },
  {
    key: 'sampleDialogue',
    label: '示例对话',
    placeholder: '"一句最能体现说话风格的台词"',
    rows: 2,
  },
];

// ─── 解析类型 ─────────────────────────────────────────────────────────────────

interface ParsedCharData {
  name: string;
  aliases?: string;
  role?: string;
  appearance?: string;
  personality?: string;
  speechStyle?: string;
  behaviorRules?: string;
  growthArc?: string;
  sampleDialogue?: string;
}

// ─── 角色卡片 ─────────────────────────────────────────────────────────────────

function CharacterCard({
  character,
  highlighted,
  onUpdate,
  onRemove,
}: {
  character: CharacterDraft;
  highlighted?: boolean;
  onUpdate: (patch: Partial<CharacterDraft>) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all duration-700 ${
        highlighted
          ? 'border-green-400 ring-2 ring-green-400 bg-green-50 dark:bg-green-950/20'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* 卡片头 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {character.name || '未命名角色'}
          </span>
          {character.role && (
            <span
              className={`shrink-0 px-2 py-0.5 text-xs rounded-full font-medium ${ROLE_COLORS[character.role]}`}
            >
              {character.role}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 ml-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            删除
          </button>
          <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* 字段区 */}
      {expanded && (
        <div className="px-4 py-4 space-y-3">
          {/* 姓名 + 别名 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={character.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                placeholder="角色姓名"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                别名
              </label>
              <input
                type="text"
                value={character.aliases}
                onChange={(e) => onUpdate({ aliases: e.target.value })}
                placeholder="绰号、代号（可空）"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 角色定位 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              角色定位
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => onUpdate({ role })}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    character.role === role
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* 文本字段 */}
          {TEXT_FIELDS.map(({ key, label, placeholder, rows }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {label}
              </label>
              <textarea
                value={character[key] as string}
                onChange={(e) => onUpdate({ [key]: e.target.value })}
                placeholder={placeholder}
                rows={rows}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

interface Props {
  data: WizardStep3;
  projectId: string;
  step1: WizardStep1;
  onAddCharacter: () => void;
  onUpdateCharacter: (id: string, patch: Partial<CharacterDraft>) => void;
  onRemoveCharacter: (id: string) => void;
  onFinish: () => void;
  onPrev: () => void;
}

interface PendingFill {
  startIndex: number;
  patches: Partial<CharacterDraft>[];
}

export default function Step3_Characters({
  data,
  projectId,
  onAddCharacter,
  onUpdateCharacter,
  onRemoveCharacter,
  onFinish,
  onPrev,
}: Props) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');
  const [parsedChars, setParsedChars] = useState<ParsedCharData[] | null>(null);
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const pendingFillRef = useRef<PendingFill | null>(null);
  const onUpdateCharacterRef = useRef(onUpdateCharacter);
  onUpdateCharacterRef.current = onUpdateCharacter;

  // ── 等待角色被加入后批量填入数据 ─────────────────────────────────────────

  useEffect(() => {
    const pending = pendingFillRef.current;
    if (!pending) return;
    const { startIndex, patches } = pending;
    if (data.characters.length >= startIndex + patches.length) {
      const addedChars = data.characters.slice(startIndex, startIndex + patches.length);
      addedChars.forEach((char, i) => {
        onUpdateCharacterRef.current(char.id, patches[i]);
      });
      // 高亮新增卡片
      setNewlyAddedIds(new Set(addedChars.map((c) => c.id)));
      setTimeout(() => setNewlyAddedIds(new Set()), 1500);
      pendingFillRef.current = null;
      setAiOutput('');
      setParsedChars(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.characters.length]);

  // ── AI 生成建议 ───────────────────────────────────────────────────────────

  async function handleAiAssist() {
    if (isAiLoading) {
      abortRef.current?.abort();
      return;
    }
    setIsAiLoading(true);
    setAiOutput('');
    setParsedChars(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/projects/${projectId}/wizard/ai-characters`, {
        method: 'POST',
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error('AI 请求失败');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setAiOutput(full);
      }

      // 流式结束后尝试解析 JSON
      try {
        const jsonStr = full
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```\s*$/, '')
          .trim();
        const parsed = JSON.parse(jsonStr) as { characters?: ParsedCharData[] };
        if (Array.isArray(parsed.characters)) {
          setParsedChars(parsed.characters);
        }
      } catch {
        // 解析失败保留原始文本
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setAiOutput('AI 生成失败：' + (e instanceof Error ? e.message : '未知错误'));
      }
    } finally {
      setIsAiLoading(false);
    }
  }

  // ── 填入单个角色 ──────────────────────────────────────────────────────────

  function fillOneCharacter(char: ParsedCharData) {
    const patch: Partial<CharacterDraft> = {
      name: char.name || '',
      aliases: char.aliases || '',
      role: (ROLES.includes(char.role as CharacterDraft['role'])
        ? char.role
        : undefined) as CharacterDraft['role'],
      appearance: char.appearance || '',
      personality: char.personality || '',
      speechStyle: char.speechStyle || '',
      behaviorRules: char.behaviorRules || '',
      growthArc: char.growthArc || '',
      sampleDialogue: char.sampleDialogue || '',
    };
    const startIndex = data.characters.length;
    pendingFillRef.current = { startIndex, patches: [patch] };
    onAddCharacter();
  }

  // ── 填入全部角色 ──────────────────────────────────────────────────────────

  function fillAllCharacters() {
    if (!parsedChars?.length) return;
    const existingNamed = data.characters.filter((c) => c.name.trim()).length;
    if (existingNamed > 0 && !window.confirm(`表单中已有 ${existingNamed} 个角色，是否追加？`)) return;

    const patches = parsedChars.map((char) => ({
      name: char.name || '',
      aliases: char.aliases || '',
      role: (ROLES.includes(char.role as CharacterDraft['role'])
        ? char.role
        : undefined) as CharacterDraft['role'],
      appearance: char.appearance || '',
      personality: char.personality || '',
      speechStyle: char.speechStyle || '',
      behaviorRules: char.behaviorRules || '',
      growthArc: char.growthArc || '',
      sampleDialogue: char.sampleDialogue || '',
    }));

    const startIndex = data.characters.length;
    pendingFillRef.current = { startIndex, patches };
    // 依次添加空角色槽，useEffect 监听到 length 变化后填入数据
    for (let i = 0; i < patches.length; i++) {
      onAddCharacter();
    }
  }

  // ── 保存并完成 ────────────────────────────────────────────────────────────

  async function handleFinish() {
    const validChars = data.characters.filter((c) => c.name.trim());

    // 没有角色也允许跳过，直接进入知识库
    if (validChars.length === 0) {
      onFinish();
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      for (const char of validChars) {
        const res = await fetch(`/api/projects/${projectId}/knowledge/characters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: char.name.trim(),
            aliases: char.aliases,
            role: char.role,
            appearance: char.appearance,
            background: '',
            personality: char.personality,
            speechStyle: char.speechStyle,
            behaviorRules: char.behaviorRules,
            growthArc: char.growthArc,
            currentState: '',
            sampleDialogue: char.sampleDialogue,
            keyEvents: '',
            relationships: [],
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || `保存角色「${char.name}」失败`);
        }
      }
      onFinish();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">人物创建</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            创建故事的主要角色，角色数据会在写作时自动注入 AI 上下文
          </p>
        </div>
        <button
          onClick={handleAiAssist}
          className={`shrink-0 px-4 py-2 text-sm rounded-md font-medium transition-colors ${
            isAiLoading
              ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
              : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
          }`}
        >
          {isAiLoading ? '生成中… (点击停止)' : '✨ AI 帮我想'}
        </button>
      </div>

      {/* AI 输出面板 */}
      {(aiOutput || parsedChars) && (
        <div className="rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
              {parsedChars && !isAiLoading
                ? `✓ AI 已生成 ${parsedChars.length} 个角色建议`
                : 'AI 生成中…'}
            </span>
            <div className="flex items-center gap-3">
              {parsedChars && !isAiLoading && parsedChars.length > 1 && (
                <button
                  onClick={fillAllCharacters}
                  className="text-xs px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-medium"
                >
                  ↓ 全部填入
                </button>
              )}
              <button
                onClick={() => {
                  setAiOutput('');
                  setParsedChars(null);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                收起
              </button>
            </div>
          </div>

          {parsedChars && !isAiLoading ? (
            /* 解析成功：逐角色展示 */
            <div className="space-y-2">
              {parsedChars.map((char, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {char.name || '未命名'}
                      </span>
                      {char.role && (
                        <span
                          className={`shrink-0 px-1.5 py-0.5 text-xs rounded-full font-medium ${
                            ROLE_COLORS[char.role as CharacterDraft['role']] ||
                            'bg-gray-100 dark:bg-gray-700 text-gray-500'
                          }`}
                        >
                          {char.role}
                        </span>
                      )}
                    </div>
                    {char.personality && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {char.personality}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => fillOneCharacter(char)}
                    className="shrink-0 text-xs px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-medium"
                  >
                    ↓ 填入
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* 流式输出或解析失败：显示原始文本 */
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
              {aiOutput}
            </pre>
          )}
        </div>
      )}

      {/* 角色卡片列表 */}
      <div className="space-y-3">
        {data.characters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            highlighted={newlyAddedIds.has(char.id)}
            onUpdate={(patch) => onUpdateCharacter(char.id, patch)}
            onRemove={() => onRemoveCharacter(char.id)}
          />
        ))}
      </div>

      {/* 添加角色按钮 */}
      <button
        type="button"
        onClick={onAddCharacter}
        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
      >
        + 添加角色
      </button>

      {data.characters.length === 0 && (
        <p className="text-xs text-center text-gray-400 dark:text-gray-500 -mt-2">
          可跳过，进入知识库后随时补充
        </p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 导航按钮 */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onPrev}
          className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ← 上一步
        </button>
        <button
          onClick={handleFinish}
          disabled={isSaving}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white disabled:text-gray-500 rounded-md font-medium transition-colors"
        >
          {isSaving ? '保存中…' : '下一步 →'}
        </button>
      </div>
    </div>
  );
}
