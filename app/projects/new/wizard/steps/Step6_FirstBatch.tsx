'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'settings' | 'generating' | 'preview';

type ChapterStatus = 'pending' | 'generating' | 'done' | 'error';

type OutlineChapter = {
  chapterNum: number;
  title: string;
  rawContent?: string;
  plotSummary?: string;
};

type GenChapter = {
  chapterNum: number;
  title: string;
  content: string;
  wordCount: number;
  status: ChapterStatus;
  error?: string;
};

type Props = {
  projectId: string;
  onPrev: () => void;
  onFinish: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countChinese(text: string): number {
  return text.replace(/\s/g, '').length;
}

function buildDirection(oc: OutlineChapter): string {
  return oc.rawContent || oc.plotSummary || `第${oc.chapterNum}章：${oc.title}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ChapterStatus }) {
  if (status === 'pending')
    return <span className="text-xs text-gray-400 dark:text-gray-500">待生成</span>;
  if (status === 'generating')
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
        <span className="animate-spin">↻</span> 生成中…
      </span>
    );
  if (status === 'done')
    return <span className="text-xs text-green-600 dark:text-green-400">✓ 完成</span>;
  return <span className="text-xs text-red-500">✕ 失败</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Step6_FirstBatch({ projectId, onPrev, onFinish }: Props) {
  const [phase, setPhase] = useState<Phase>('settings');
  const [outlineChapters, setOutlineChapters] = useState<OutlineChapter[]>([]);
  const [loadingOutline, setLoadingOutline] = useState(true);
  const [generateCount, setGenerateCount] = useState(3);
  const [chapters, setChapters] = useState<GenChapter[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Load outline chapters on mount ──────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/projects/${projectId}/knowledge/outline`)
      .then((r) => r.json())
      .then((data) => {
        const all: OutlineChapter[] = Array.isArray(data.volumes)
          ? data.volumes.flatMap((v: { chapters?: OutlineChapter[] }) =>
              Array.isArray(v.chapters) ? v.chapters : []
            )
          : [];
        const sorted = [...all].sort((a, b) => a.chapterNum - b.chapterNum);
        setOutlineChapters(sorted.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoadingOutline(false));
  }, [projectId]);

  // ── State helpers ────────────────────────────────────────────────────────────
  function patchChapter(chapterNum: number, patch: Partial<GenChapter>) {
    setChapters((prev) =>
      prev.map((c) => (c.chapterNum === chapterNum ? { ...c, ...patch } : c))
    );
  }

  // ── Start generation ─────────────────────────────────────────────────────────
  async function handleStart() {
    const toGenerate = outlineChapters.slice(0, generateCount);
    if (!toGenerate.length) return;

    const initial: GenChapter[] = toGenerate.map((oc, i) => ({
      chapterNum: oc.chapterNum,
      title: oc.title,
      content: '',
      wordCount: 0,
      status: i === 0 ? ('generating' as ChapterStatus) : ('pending' as ChapterStatus),
    }));

    setChapters(initial);
    setCurrentIdx(0);
    setCollapsed({});
    setPhase('generating');

    const abort = new AbortController();
    abortRef.current = abort;

    for (let i = 0; i < toGenerate.length; i++) {
      if (abort.signal.aborted) break;

      const oc = toGenerate[i];
      setCurrentIdx(i);

      // Mark current as generating, next as pending
      setChapters((prev) =>
        prev.map((c, idx) => {
          if (c.chapterNum === oc.chapterNum) return { ...c, status: 'generating' };
          if (idx > i && c.status === 'pending') return c;
          return c;
        })
      );

      try {
        const direction = buildDirection(oc);
        const res = await fetch('/api/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step: 1,
            direction,
            projectId,
            chapterNo: String(oc.chapterNum),
          }),
          signal: abort.signal,
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          // Update content in real-time (throttle renders via batching)
          const snap = text;
          setChapters((prev) =>
            prev.map((c) =>
              c.chapterNum === oc.chapterNum
                ? { ...c, content: snap, wordCount: countChinese(snap) }
                : c
            )
          );
        }

        patchChapter(oc.chapterNum, {
          status: 'done',
          content: text,
          wordCount: countChinese(text),
        });
      } catch (e) {
        if (!abort.signal.aborted) {
          const msg = e instanceof Error ? e.message : '生成失败';
          patchChapter(oc.chapterNum, { status: 'error', error: msg });
        }
      }
    }

    setPhase('preview');
  }

  // ── Save + Finish ────────────────────────────────────────────────────────────
  async function handleSaveAndFinish() {
    setSaving(true);
    try {
      for (const ch of chapters) {
        if (ch.status !== 'done' || !ch.content) continue;
        await fetch(`/api/projects/${projectId}/chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapterNum: ch.chapterNum,
            title: ch.title,
            content: ch.content,
          }),
        });
      }
    } catch {
      // non-blocking: proceed to workspace even if save partially fails
    }
    onFinish();
  }

  // ── Toggle collapse ──────────────────────────────────────────────────────────
  function toggleCollapse(num: number) {
    setCollapsed((prev) => ({ ...prev, [num]: !prev[num] }));
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Settings phase
  // ────────────────────────────────────────────────────────────────────────────
  if (phase === 'settings') {
    const preview = outlineChapters.slice(0, generateCount);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            首批章节试读生成
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            AI 将基于细纲生成初稿，供你预览整体写作风格。满意后保存至项目，不满意可随时调整再生成。
          </p>
        </div>

        {/* 生成章节数 */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">生成设置</h3>

          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              生成章节数
            </label>
            <select
              value={generateCount}
              onChange={(e) => setGenerateCount(Number(e.target.value))}
              className="rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} 章
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              （最多 5 章，建议先生成 3 章感受风格）
            </span>
          </div>

          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              写作风格
            </label>
            <select
              disabled
              className="rounded-md border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 text-sm px-3 py-1.5 text-gray-400 dark:text-gray-600 cursor-not-allowed"
            >
              <option>默认（更多模板即将开放）</option>
            </select>
          </div>
        </div>

        {/* 章节预览列表 */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            将生成以下章节
            {loadingOutline && (
              <span className="ml-2 text-xs text-gray-400 font-normal">加载细纲中…</span>
            )}
          </h3>

          {!loadingOutline && outlineChapters.length === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md p-3">
              未找到分章细纲，请先完成步骤 5（分卷细纲生成）再来这里。
            </p>
          )}

          {preview.map((oc, i) => (
            <div
              key={oc.chapterNum}
              className="flex gap-3 p-3 rounded-md bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-medium">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  第{oc.chapterNum}章 · {oc.title}
                </div>
                {(oc.plotSummary || oc.rawContent) && (
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {(oc.plotSummary || oc.rawContent || '').slice(0, 120)}…
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between">
          <button
            onClick={onPrev}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← 返回细纲
          </button>
          <div className="flex gap-3">
            <button
              onClick={onFinish}
              className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              跳过，直接去工作台
            </button>
            <button
              onClick={handleStart}
              disabled={loadingOutline || outlineChapters.length === 0}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900 text-white rounded-md text-sm font-medium transition-colors"
            >
              开始生成试读章节 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Generating phase
  // ────────────────────────────────────────────────────────────────────────────
  if (phase === 'generating') {
    const doneCount = chapters.filter((c) => c.status === 'done').length;
    const total = chapters.length;
    const currentChapter = chapters[currentIdx];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            正在生成试读章节
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            已完成 {doneCount}/{total} 章，请耐心等待…
          </p>
          {/* 总进度条 */}
          <div className="mt-2 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${total > 0 ? (doneCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* 章节状态列表 */}
        <div className="space-y-3">
          {chapters.map((ch) => (
            <div
              key={ch.chapterNum}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden"
            >
              {/* 头部：标题 + 状态 */}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  第{ch.chapterNum}章 · {ch.title}
                </span>
                <div className="flex items-center gap-3">
                  {ch.status === 'done' && (
                    <span className="text-xs text-gray-400">{ch.wordCount.toLocaleString()} 字</span>
                  )}
                  <StatusBadge status={ch.status} />
                </div>
              </div>

              {/* 当前生成章节的流式预览（前300字） */}
              {ch.status === 'generating' && ch.content && (
                <div className="px-4 pb-3 border-t border-gray-100 dark:border-zinc-800">
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono leading-relaxed line-clamp-4 whitespace-pre-wrap">
                    {ch.content.slice(0, 300)}
                    <span className="animate-pulse">▌</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    已生成 {ch.wordCount.toLocaleString()} 字
                  </div>
                </div>
              )}

              {/* 错误信息 */}
              {ch.status === 'error' && ch.error && (
                <div className="px-4 pb-3 border-t border-red-100 dark:border-red-900">
                  <p className="mt-2 text-xs text-red-500">{ch.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 提示 */}
        {currentChapter?.status === 'generating' && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            正在生成第 {currentIdx + 1}/{total} 章：《{currentChapter.title}》
          </p>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER: Preview phase
  // ────────────────────────────────────────────────────────────────────────────
  const doneChapters = chapters.filter((c) => c.status === 'done');
  const failedChapters = chapters.filter((c) => c.status === 'error');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          试读结果
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          已生成 {doneChapters.length} 章
          {failedChapters.length > 0 && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">
              （{failedChapters.length} 章生成失败）
            </span>
          )}
          · 满意后可保存至项目并前往工作台
        </p>
      </div>

      {/* 章节卡片 */}
      <div className="space-y-3">
        {chapters.map((ch) => (
          <div
            key={ch.chapterNum}
            className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden"
          >
            {/* 头部 */}
            <button
              onClick={() => ch.status === 'done' && toggleCollapse(ch.chapterNum)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                ch.status === 'done'
                  ? 'hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                第{ch.chapterNum}章 · {ch.title}
              </span>
              <div className="flex items-center gap-3">
                {ch.status === 'done' && (
                  <>
                    <span className="text-xs text-gray-400">{ch.wordCount.toLocaleString()} 字</span>
                    <span className="text-xs text-green-600 dark:text-green-400">✓</span>
                    <span className="text-gray-400 text-xs w-4">
                      {collapsed[ch.chapterNum] ? '▶' : '▼'}
                    </span>
                  </>
                )}
                {ch.status === 'error' && (
                  <span className="text-xs text-red-500">✕ 生成失败</span>
                )}
              </div>
            </button>

            {/* 正文（展开） */}
            {ch.status === 'done' && !collapsed[ch.chapterNum] && (
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-zinc-800">
                <div className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto font-serif">
                  {ch.content}
                </div>
              </div>
            )}

            {/* 错误详情 */}
            {ch.status === 'error' && ch.error && (
              <div className="px-4 pb-3 border-t border-red-100 dark:border-red-900">
                <p className="mt-2 text-xs text-red-500">{ch.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <button
          onClick={() => setPhase('settings')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          不满意，调整设置
        </button>
        <div className="flex gap-3">
          <button
            onClick={onFinish}
            className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            不保存，直接去工作台
          </button>
          {doneChapters.length > 0 && (
            <button
              onClick={handleSaveAndFinish}
              disabled={saving}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md text-sm font-medium transition-colors"
            >
              {saving
                ? '保存中…'
                : `满意！保存 ${doneChapters.length} 章并完成向导 →`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
