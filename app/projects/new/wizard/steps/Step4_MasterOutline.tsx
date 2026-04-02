'use client';

import { useState, useRef } from 'react';
import type { WizardStep1, WizardStep2, WizardStep3, WizardStep4, VolumeOutline } from '../hooks/useWizardState';

// ─── 配置 ─────────────────────────────────────────────────────────────────────

const CHAPTER_OPTIONS = [100, 150, 200, 250, 300];

// volume count suggestions based on total chapters
function suggestVolumes(totalChapters: number) {
  return Math.max(2, Math.round(totalChapters / 50));
}

// ─── AI 解析类型 ───────────────────────────────────────────────────────────────

interface ParsedVolume {
  volumeNum: number;
  volumeTitle: string;
  chapterRange: string;
  coreConflict: string;
  mainPlot: string;
  systemPhase: string;
  pleasureType: string;
  keyTurningPoints: string;
  emotionalArc: string;
}

// ─── 信息摘要卡片 ──────────────────────────────────────────────────────────────

function SummaryCard({ step1, step2, step3 }: { step1: WizardStep1; step2: WizardStep2; step3: WizardStep3 }) {
  const charCount = step3.characters.filter((c) => c.name.trim()).length;
  const protagonist = step3.characters.find((c) => c.role === '主角');

  return (
    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-4 mb-6">
      <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
        AI 将基于以下信息生成大纲
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">书名</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{step1.title || '—'}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">类型</span>
          <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{step1.genre || '—'}</span>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500 dark:text-gray-400">简介</span>
          <span className="ml-2 text-gray-800 dark:text-gray-200">
            {step1.synopsis ? step1.synopsis.slice(0, 80) + (step1.synopsis.length > 80 ? '…' : '') : '—'}
          </span>
        </div>
        {step1.coreAbility && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">金手指</span>
            <span className="ml-2 text-gray-800 dark:text-gray-200">{step1.coreAbility.slice(0, 60)}</span>
          </div>
        )}
        {step2.worldBackground && (
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">世界观</span>
            <span className="ml-2 text-gray-800 dark:text-gray-200">
              {step2.worldBackground.slice(0, 60)}…
            </span>
          </div>
        )}
        <div>
          <span className="text-gray-500 dark:text-gray-400">主角</span>
          <span className="ml-2 text-gray-800 dark:text-gray-200">{protagonist?.name || '待设定'}</span>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">角色数</span>
          <span className="ml-2 text-gray-800 dark:text-gray-200">{charCount} 个</span>
        </div>
      </div>
    </div>
  );
}

// ─── 卷大纲卡片 ───────────────────────────────────────────────────────────────

const VOLUME_FIELDS: Array<{ key: keyof VolumeOutline; label: string; rows?: number; placeholder: string }> = [
  { key: 'chapterRange', label: '章节范围', placeholder: '如：1-50' },
  { key: 'coreConflict', label: '核心冲突', rows: 2, placeholder: '本卷主要矛盾冲突' },
  { key: 'mainPlot', label: '主线推进', rows: 3, placeholder: '主线剧情走向与节奏' },
  { key: 'systemPhase', label: '金手指阶段', rows: 2, placeholder: '主角能力在本卷的成长突破' },
  { key: 'pleasureType', label: '爽点类型', placeholder: '如：逆袭打脸、升级突破' },
  { key: 'keyTurningPoints', label: '关键转折点', rows: 2, placeholder: '2-3个关键节点，用分号隔开' },
  { key: 'emotionalArc', label: '情感弧线', placeholder: '主角情感状态变化' },
];

function VolumeCard({
  volume,
  onChange,
}: {
  volume: VolumeOutline;
  onChange: (patch: Partial<VolumeOutline>) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 卡片头 */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {volume.volumeNum}
          </span>
          {expanded ? (
            <input
              type="text"
              value={volume.volumeTitle}
              onChange={(e) => {
                e.stopPropagation();
                onChange({ volumeTitle: e.target.value });
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder={`第${volume.volumeNum}卷卷名`}
              className="flex-1 min-w-0 bg-transparent border-b border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 px-1 py-0.5"
            />
          ) : (
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {volume.volumeTitle || `第${volume.volumeNum}卷`}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-xs ml-2 shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* 字段区 */}
      {expanded && (
        <div className="px-4 py-4 grid grid-cols-1 gap-3">
          {VOLUME_FIELDS.map(({ key, label, rows, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                {label}
              </label>
              {rows ? (
                <textarea
                  value={String(volume[key] ?? '')}
                  onChange={(e) => onChange({ [key]: e.target.value })}
                  placeholder={placeholder}
                  rows={rows}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={String(volume[key] ?? '')}
                  onChange={(e) => onChange({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  step1: WizardStep1;
  step2: WizardStep2;
  step3: WizardStep3;
  data: WizardStep4;
  onChange: (patch: Partial<WizardStep4>) => void;
  onUpdateVolume: (id: string, patch: Partial<VolumeOutline>) => void;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
}

export default function Step4_MasterOutline({
  projectId,
  step1,
  step2,
  step3,
  data,
  onChange,
  onUpdateVolume,
  onNext,
  onPrev,
  onFinish,
}: Props) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [truncatedCount, setTruncatedCount] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── AI 生成 ────────────────────────────────────────────────────────────────

  async function handleAiGenerate() {
    if (isAiLoading) {
      abortRef.current?.abort();
      return;
    }
    setIsAiLoading(true);
    setAiOutput('');
    setError('');
    setSavedSuccess(false);
    setTruncatedCount(null);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/projects/${projectId}/wizard/ai-outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalChapters: data.totalChapters,
          volumeCount: data.volumeCount,
          coreAbility: step1.coreAbility,
        }),
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

      // ── 解析 JSON（含截断自动修复） ──────────────────────────────────────────
      const jsonStr = full
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();

      /** 尝试修复被截断的 JSON：找到最后一个完整卷对象后截取并补 `]}` */
      function repairTruncated(raw: string): { volumes?: ParsedVolume[] } | null {
        let lastVolumeEnd = -1;
        let depth = 0;
        let inString = false;
        let escape = false;
        for (let i = 0; i < raw.length; i++) {
          const ch = raw[i];
          if (escape) { escape = false; continue; }
          if (inString) {
            if (ch === '\\') escape = true;
            else if (ch === '"') inString = false;
            continue;
          }
          if (ch === '"') { inString = true; continue; }
          if (ch === '{' || ch === '[') depth++;
          else if (ch === '}' || ch === ']') {
            depth--;
            // depth 2 = 刚关闭一个卷对象（根对象depth=1, volumes数组depth=2, 卷对象depth=3）
            if (depth === 2) lastVolumeEnd = i;
          }
        }
        if (lastVolumeEnd === -1) return null;
        try {
          return JSON.parse(raw.slice(0, lastVolumeEnd + 1) + ']}') as { volumes?: ParsedVolume[] };
        } catch {
          return null;
        }
      }

      function applyVolumes(parsed: { volumes?: ParsedVolume[] }, wasTruncated: boolean) {
        if (!Array.isArray(parsed.volumes) || parsed.volumes.length === 0) {
          setError('AI 返回数据格式异常，请重试');
          return;
        }
        const volumes: VolumeOutline[] = parsed.volumes.map((v) => ({
          id: crypto.randomUUID(),
          volumeNum: v.volumeNum || 1,
          volumeTitle: v.volumeTitle || '',
          chapterRange: v.chapterRange || '',
          coreConflict: v.coreConflict || '',
          mainPlot: v.mainPlot || '',
          systemPhase: v.systemPhase || '',
          pleasureType: v.pleasureType || '',
          keyTurningPoints: v.keyTurningPoints || '',
          emotionalArc: v.emotionalArc || '',
        }));
        onChange({ volumes });
        setAiOutput('');
        if (wasTruncated) setTruncatedCount(volumes.length);
      }

      // 第一步：直接解析
      try {
        applyVolumes(JSON.parse(jsonStr) as { volumes?: ParsedVolume[] }, false);
      } catch {
        // 第二步：尝试截断修复
        const repaired = repairTruncated(jsonStr);
        if (repaired) {
          applyVolumes(repaired, true);
        } else {
          setError('解析 AI 输出失败，原始内容已显示，可尝试重新生成');
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError('AI 生成失败：' + (e instanceof Error ? e.message : '未知错误'));
        setAiOutput('');
      }
    } finally {
      setIsAiLoading(false);
    }
  }

  // ── 保存大纲 ──────────────────────────────────────────────────────────────

  async function handleSave() {
    if (data.volumes.length === 0) {
      setError('请先生成或填写大纲内容');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/wizard/save-outline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalChapters: data.totalChapters,
          volumes: data.volumes.map(({ id: _id, ...rest }) => rest),
        }),
      });
      if (!res.ok) throw new Error('保存失败，请重试');
      setSavedSuccess(true);
      // 短暂提示后进入 Step5
      setTimeout(() => onNext(), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSkipToStep5() {
    if (isSaving || isAiLoading) return;

    const buildFallbackVolumes = (): VolumeOutline[] => {
      const total = data.totalChapters;
      const count = Math.max(1, data.volumeCount || 1);
      const base = Math.floor(total / count);
      const remainder = total % count;
      let start = 1;

      return Array.from({ length: count }, (_, idx) => {
        const extra = idx < remainder ? 1 : 0;
        const end = start + base + extra - 1;
        const volumeNum = idx + 1;
        const volume: VolumeOutline = {
          id: crypto.randomUUID(),
          volumeNum,
          volumeTitle: `第${volumeNum}卷`,
          chapterRange: `${start}-${end}`,
          coreConflict: '',
          mainPlot: aiOutput ? 'AI 原始输出解析失败，待后续补全。' : '',
          systemPhase: '',
          pleasureType: '',
          keyTurningPoints: '',
          emotionalArc: '',
        };
        start = end + 1;
        return volume;
      });
    };

    const volumesToSave = data.volumes.length > 0 ? data.volumes : buildFallbackVolumes();

    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/wizard/save-outline`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalChapters: data.totalChapters,
          volumes: volumesToSave.map(({ id: _id, ...rest }) => rest),
        }),
      });
      if (!res.ok) throw new Error('跳过前保存主大纲失败');

      if (data.volumes.length === 0) {
        onChange({ volumes: volumesToSave });
      }
      onNext();
    } catch (e) {
      setError(e instanceof Error ? e.message : '跳过前保存失败');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasVolumes = data.volumes.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">故事骨架</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          生成全书分卷大纲，AI 创作时将以此为指引把控故事节奏
        </p>
      </div>

      {/* 信息摘要 */}
      <SummaryCard step1={step1} step2={step2} step3={step3} />

      {/* 章数 & 卷数设置 */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            预计总章数
          </label>
          <select
            value={data.totalChapters}
            onChange={(e) => {
              const tc = Number(e.target.value);
              // 若没有已生成的卷，自动同步建议卷数
              const vc = hasVolumes ? data.volumeCount : suggestVolumes(tc);
              onChange({ totalChapters: tc, volumeCount: vc });
            }}
            className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {CHAPTER_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} 章
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            分卷数量
          </label>
          <select
            value={data.volumeCount}
            onChange={(e) => onChange({ volumeCount: Number(e.target.value) })}
            className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} 卷
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            （约 {Math.round(data.totalChapters / data.volumeCount)} 章/卷）
          </span>
        </div>
      </div>

      {/* AI 生成按钮 */}
      <button
        onClick={handleAiGenerate}
        disabled={isSaving}
        className={`w-full py-2.5 rounded-md text-sm font-medium transition-colors ${
          isAiLoading
            ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
            : hasVolumes
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            : 'bg-purple-600 hover:bg-purple-700 text-white'
        }`}
      >
        {isAiLoading
          ? '✨ AI 生成中… (点击停止)'
          : hasVolumes
          ? '↺ 重新生成'
          : '✨ AI 生成全书大纲'}
      </button>

      {/* AI 流式输出（解析失败时显示原始文本） */}
      {(isAiLoading || aiOutput) && (
        <div className="rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 p-3">
          <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-2">
            {isAiLoading ? 'AI 正在规划全书大纲，请稍候…' : '原始输出（解析失败）'}
          </p>
          {isAiLoading ? (
            <div className="flex items-center gap-2 py-4">
              <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-purple-600 dark:text-purple-400">
                正在生成 {data.volumeCount} 卷大纲…
              </span>
            </div>
          ) : (
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
              {aiOutput}
            </pre>
          )}
        </div>
      )}

      {/* 可编辑卷卡片 */}
      {hasVolumes && !isAiLoading && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            全书大纲（{data.volumes.length} 卷 · 可编辑）
          </h2>
          {data.volumes.map((vol) => (
            <VolumeCard
              key={vol.id}
              volume={vol}
              onChange={(patch) => onUpdateVolume(vol.id, patch)}
            />
          ))}
        </div>
      )}

      {truncatedCount !== null && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          ⚠️ 已恢复 {truncatedCount} 卷（输出被 token 限制截断），其余卷未包含，可点击「↺ 重新生成」获取完整大纲
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {savedSuccess && (
        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
          ✓ 大纲已保存，正在进入下一步…
        </p>
      )}

      {/* 导航按钮 */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onPrev}
          disabled={isAiLoading || isSaving}
          className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          ← 上一步
        </button>
        <div className="flex gap-3">
          {!hasVolumes && !!aiOutput && !isAiLoading && (
            <button
              onClick={handleSkipToStep5}
              disabled={isSaving}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              跳过此步 →
            </button>
          )}
          {hasVolumes && (
            <button
              onClick={onFinish}
              disabled={isSaving}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              跳过，前往项目
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasVolumes || isSaving || isAiLoading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white disabled:text-gray-500 rounded-md font-medium transition-colors"
          >
            {isSaving ? '保存中…' : '确认并保存 →'}
          </button>
        </div>
      </div>
    </div>
  );
}
