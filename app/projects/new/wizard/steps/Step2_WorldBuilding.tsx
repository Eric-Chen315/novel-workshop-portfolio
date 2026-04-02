'use client';

import { useState, useRef } from 'react';
import type { WizardStep2, WizardStep1, WorldItem } from '../hooks/useWizardState';

// ─── 解析类型 ─────────────────────────────────────────────────────────────────

interface ParsedWorldData {
  background?: string;
  powerSystem?: string;
  factions?: { name: string; description: string }[];
  locations?: { name: string; description: string }[];
  items?: { name: string; description: string }[];
}

// ─── 动态列表子组件 ────────────────────────────────────────────────────────────

function DynamicList({
  label,
  items,
  namePlaceholder,
  descPlaceholder,
  highlighted,
  onAdd,
  onUpdate,
  onRemove,
}: {
  label: string;
  items: WorldItem[];
  namePlaceholder: string;
  descPlaceholder: string;
  highlighted?: boolean;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<WorldItem>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className={`rounded transition-all duration-700 ${
        highlighted ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-950/30 p-2 -m-2' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          + 添加
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic py-1">
          暂无 —— 点击「+ 添加」新增
        </p>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex gap-2 items-center">
            <input
              type="text"
              value={item.name}
              onChange={(e) => onUpdate(item.id, { name: e.target.value })}
              placeholder={namePlaceholder}
              className="w-28 flex-shrink-0 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={item.description}
              onChange={(e) => onUpdate(item.id, { description: e.target.value })}
              placeholder={descPlaceholder}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-gray-400 hover:text-red-500 transition-colors px-1 flex-shrink-0"
              title="删除"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

interface Props {
  data: WizardStep2;
  projectId: string;
  step1: WizardStep1;
  onChange: (data: Partial<WizardStep2>) => void;
  onAddItem: (field: 'factions' | 'locations' | 'items') => void;
  onUpdateItem: (
    field: 'factions' | 'locations' | 'items',
    id: string,
    patch: Partial<WorldItem>
  ) => void;
  onRemoveItem: (field: 'factions' | 'locations' | 'items', id: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step2_WorldBuilding({
  data,
  projectId,
  step1,
  onChange,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onNext,
  onPrev,
}: Props) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');
  const [parsedWorld, setParsedWorld] = useState<ParsedWorldData | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  function flashFields(fields: string[]) {
    setHighlightedFields(new Set(fields));
    setTimeout(() => setHighlightedFields(new Set()), 1500);
  }

  function hl(key: string): string {
    return highlightedFields.has(key)
      ? ' ring-2 ring-green-400 bg-green-50 dark:bg-green-950/50'
      : '';
  }

  // ── AI 生成 ────────────────────────────────────────────────────────────────

  async function handleAiAssist() {
    if (isAiLoading) {
      abortRef.current?.abort();
      return;
    }
    setIsAiLoading(true);
    setAiOutput('');
    setParsedWorld(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/projects/${projectId}/wizard/ai-world`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coreAbility: step1.coreAbility }),
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
        const parsed = JSON.parse(jsonStr) as ParsedWorldData;
        setParsedWorld(parsed);
      } catch {
        // 解析失败保留原始文本展示
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setAiOutput('AI 生成失败：' + (e instanceof Error ? e.message : '未知错误'));
      }
    } finally {
      setIsAiLoading(false);
    }
  }

  // ── 一键填入 ───────────────────────────────────────────────────────────────

  function handleFillFromAi() {
    if (!parsedWorld) return;

    const hasContent =
      data.worldBackground.trim() ||
      data.powerSystem.trim() ||
      data.factions.length > 0 ||
      data.locations.length > 0 ||
      data.items.length > 0;

    if (hasContent && !window.confirm('表单中已有内容，是否覆盖？')) return;

    const updates: Partial<WizardStep2> = {};
    const flashKeys: string[] = [];

    if (parsedWorld.background) {
      updates.worldBackground = parsedWorld.background;
      flashKeys.push('worldBackground');
    }
    if (parsedWorld.powerSystem) {
      updates.powerSystem = parsedWorld.powerSystem;
      flashKeys.push('powerSystem');
    }
    if (parsedWorld.factions?.length) {
      updates.factions = parsedWorld.factions.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        description: f.description,
      }));
      flashKeys.push('factions');
    }
    if (parsedWorld.locations?.length) {
      updates.locations = parsedWorld.locations.map((l) => ({
        id: crypto.randomUUID(),
        name: l.name,
        description: l.description,
      }));
      flashKeys.push('locations');
    }
    if (parsedWorld.items?.length) {
      updates.items = parsedWorld.items.map((i) => ({
        id: crypto.randomUUID(),
        name: i.name,
        description: i.description,
      }));
      flashKeys.push('items');
    }

    onChange(updates);
    flashFields(flashKeys);
    setAiOutput('');
    setParsedWorld(null);
  }

  // ── 保存并下一步 ──────────────────────────────────────────────────────────

  async function handleNext() {
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/wizard/save-world`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worldBackground: data.worldBackground,
          powerSystem: data.powerSystem,
          factions: data.factions,
          locations: data.locations,
          items: data.items,
        }),
      });
      if (!res.ok) throw new Error('保存失败，请重试');
      onNext();
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">世界观构建</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            设定故事世界，写作时会自动注入 AI 上下文
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
      {(aiOutput || parsedWorld) && (
        <div className="rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
              {parsedWorld && !isAiLoading ? '✓ AI 已生成世界观建议' : 'AI 生成中…'}
            </span>
            <button
              onClick={() => {
                setAiOutput('');
                setParsedWorld(null);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              收起
            </button>
          </div>

          {parsedWorld && !isAiLoading ? (
            /* 解析成功：显示摘要 + 一键填入 */
            <div className="space-y-1.5">
              {parsedWorld.background && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-500 dark:text-gray-500">世界背景</span>{' '}
                  已生成（{parsedWorld.background.length} 字）
                </p>
              )}
              {parsedWorld.powerSystem && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-500 dark:text-gray-500">力量体系</span>{' '}
                  已生成（{parsedWorld.powerSystem.length} 字）
                </p>
              )}
              {parsedWorld.factions?.length ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-500 dark:text-gray-500">主要势力</span>{' '}
                  {parsedWorld.factions.length} 个：
                  {parsedWorld.factions.map((f) => f.name).join('、')}
                </p>
              ) : null}
              {parsedWorld.locations?.length ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-500 dark:text-gray-500">关键地点</span>{' '}
                  {parsedWorld.locations.length} 个：
                  {parsedWorld.locations.map((l) => l.name).join('、')}
                </p>
              ) : null}
              {parsedWorld.items?.length ? (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-gray-500 dark:text-gray-500">重要道具</span>{' '}
                  {parsedWorld.items.length} 个：
                  {parsedWorld.items.map((i) => i.name).join('、')}
                </p>
              ) : null}
              <button
                onClick={handleFillFromAi}
                className="mt-2 w-full py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors"
              >
                ↓ 一键填入表单
              </button>
            </div>
          ) : (
            /* 流式输出或解析失败：显示原始文本 */
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
              {aiOutput}
            </pre>
          )}
        </div>
      )}

      {/* 世界背景 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          世界背景
        </label>
        <textarea
          value={data.worldBackground}
          onChange={(e) => onChange({ worldBackground: e.target.value })}
          placeholder="故事世界的整体设定：时代背景、技术水平、社会结构……"
          rows={4}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all duration-700${hl('worldBackground')}`}
        />
      </div>

      {/* 力量体系 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          力量体系 / 核心规则
        </label>
        <textarea
          value={data.powerSystem}
          onChange={(e) => onChange({ powerSystem: e.target.value })}
          placeholder="修炼等级、能力体系、获得力量的方式与规则……"
          rows={4}
          className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all duration-700${hl('powerSystem')}`}
        />
      </div>

      {/* 动态列表：势力 */}
      <DynamicList
        label="主要势力 / 阵营"
        items={data.factions}
        namePlaceholder="势力名"
        descPlaceholder="势力描述"
        highlighted={highlightedFields.has('factions')}
        onAdd={() => onAddItem('factions')}
        onUpdate={(id, p) => onUpdateItem('factions', id, p)}
        onRemove={(id) => onRemoveItem('factions', id)}
      />

      {/* 动态列表：地点 */}
      <DynamicList
        label="关键地点"
        items={data.locations}
        namePlaceholder="地点名"
        descPlaceholder="地点描述"
        highlighted={highlightedFields.has('locations')}
        onAdd={() => onAddItem('locations')}
        onUpdate={(id, p) => onUpdateItem('locations', id, p)}
        onRemove={(id) => onRemoveItem('locations', id)}
      />

      {/* 动态列表：道具/概念 */}
      <DynamicList
        label="重要道具 / 概念"
        items={data.items}
        namePlaceholder="名称"
        descPlaceholder="描述"
        highlighted={highlightedFields.has('items')}
        onAdd={() => onAddItem('items')}
        onUpdate={(id, p) => onUpdateItem('items', id, p)}
        onRemove={(id) => onRemoveItem('items', id)}
      />

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
          onClick={handleNext}
          disabled={isSaving}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white disabled:text-gray-500 rounded-md font-medium transition-colors"
        >
          {isSaving ? '保存中…' : '下一步 →'}
        </button>
      </div>
    </div>
  );
}
