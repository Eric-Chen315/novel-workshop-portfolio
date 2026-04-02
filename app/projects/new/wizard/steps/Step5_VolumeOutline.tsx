'use client';

import { useState, useEffect } from 'react';
import type { WizardStep4 } from '../hooks/useWizardState';
import type { AuditIssue, AuditReport } from '@/lib/postGenValidator';
import type { FactRegistry } from '@/lib/factsManager';

// ─── Constants ─────────────────────────────────────────────────────────────────

const BATCH_SIZE = 5;

// ─── Types ─────────────────────────────────────────────────────────────────────

type MasterVolume = {
  volumeNum: number;
  volumeTitle: string;
  chapterRange: string;
  coreConflict: string;
  mainPlot: string;
  systemPhase: string;
  pleasureType: string;
  keyTurningPoints: string;
  emotionalArc: string;
};

type GeneratedChapter = {
  chapterNum: number;
  title: string;
  corePurpose: string;
  plotPoints: string[];
  keyCharacters: string[];
  emotionalArc: string;
  endHook: string;
  connectionToPrev: string;
  connectionToNext: string;
  mustInclude: string[];
  wordCountGuide: string;
};

type VolStatus = 'idle' | 'generating' | 'preview' | 'auditing' | 'saving' | 'saved';

type VolState = {
  status: VolStatus;
  chapters: GeneratedChapter[];
  error: string;
  /** Batch progress fields (only meaningful while status === 'generating') */
  batchTotal: number;
  batchDone: number;
  batchProgress: string;
  /** Set when a batch fails — enables retry from that point */
  failedBatch: { batchIdx: number; start: number; end: number } | null;
  /** StoryGuard audit state */
  auditReport: AuditReport | null;
  auditError: string;
  showIgnoreConfirm: boolean;
};

type FactsApiResponse = Partial<FactRegistry> & {
  exists?: boolean;
};

const DEFAULT_VOL_STATE: VolState = {
  status: 'idle',
  chapters: [],
  error: '',
  batchTotal: 1,
  batchDone: 0,
  batchProgress: '',
  failedBatch: null,
  auditReport: null,
  auditError: '',
  showIgnoreConfirm: false,
};

// ─── Pure helpers ──────────────────────────────────────────────────────────────

/** Parse "1-50" / "1–50" / "第1-50章" etc. → { start, end } */
function parseChapterRange(range: string): { start: number; end: number } | null {
  const m = range.match(/(\d+)\s*[-–—]\s*(\d+)/);
  if (!m) return null;
  return { start: parseInt(m[1], 10), end: parseInt(m[2], 10) };
}

/** Split [start, end] into batches of at most BATCH_SIZE chapters */
function buildBatches(start: number, end: number): Array<{ start: number; end: number }> {
  const result: Array<{ start: number; end: number }> = [];
  for (let s = start; s <= end; s += BATCH_SIZE) {
    result.push({ start: s, end: Math.min(s + BATCH_SIZE - 1, end) });
  }
  return result;
}

function buildVolumeSummary(vol: MasterVolume): string {
  return [
    vol.coreConflict && `【核心冲突】${vol.coreConflict}`,
    vol.mainPlot && `【主线推进】${vol.mainPlot}`,
    vol.systemPhase && `【体系阶段】${vol.systemPhase}`,
    vol.pleasureType && `【爽点类型】${vol.pleasureType}`,
    vol.keyTurningPoints && `【关键转折】${vol.keyTurningPoints}`,
    vol.emotionalArc && `【情感弧线】${vol.emotionalArc}`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── Editable chapter preview card ────────────────────────────────────────────

const inputCls =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100';

function ChapterCard({
  ch,
  collapsed,
  onToggle,
  onChange,
}: {
  ch: GeneratedChapter;
  collapsed: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<GeneratedChapter>) => void;
}) {
  return (
    <div className="rounded-lg border-l-4 border-l-blue-500 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium dark:text-zinc-100 text-sm truncate">
          第{ch.chapterNum}章：{ch.title}
        </div>
        <button
          onClick={onToggle}
          className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {collapsed ? '展开' : '折叠'}
        </button>
      </div>
      {!collapsed && (
        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">章节号</label>
              <input
                type="number"
                value={ch.chapterNum}
                onChange={(e) => onChange({ chapterNum: +e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">标题</label>
              <input
                value={ch.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">核心功能</label>
            <textarea
              rows={2}
              value={ch.corePurpose}
              onChange={(e) => onChange({ corePurpose: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">情节点（每行一个）</label>
            <textarea
              rows={4}
              value={(ch.plotPoints || []).join('\n')}
              onChange={(e) => onChange({ plotPoints: e.target.value.split('\n').filter(Boolean) })}
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">关键角色（逗号分隔）</label>
              <input
                value={(ch.keyCharacters || []).join(',')}
                onChange={(e) =>
                  onChange({
                    keyCharacters: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">字数建议</label>
              <input
                value={ch.wordCountGuide}
                onChange={(e) => onChange({ wordCountGuide: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">情绪弧线</label>
            <input
              value={ch.emotionalArc}
              onChange={(e) => onChange({ emotionalArc: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">章末钩子</label>
            <textarea
              rows={2}
              value={ch.endHook}
              onChange={(e) => onChange({ endHook: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Audit severity helpers ──────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, { border: string; bg: string; text: string; label: string }> = {
  critical: { border: 'border-red-400', bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-300', label: '严重' },
  warning: { border: 'border-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-300', label: '警告' },
  info: { border: 'border-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-300', label: '提示' },
};

const TYPE_LABELS: Record<string, string> = {
  continuity: '连续性',
  version_regression: '版本回退',
  redundant_reveal: '重复揭示',
  pattern_repetition: '模式雷同',
  logic_error: '逻辑错误',
};

function AuditIssueCard({ issue }: { issue: AuditIssue }) {
  const style = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.info;
  return (
    <div className={`rounded-md border-l-4 ${style.border} ${style.bg} p-3 space-y-1`}>
      <div className="flex items-center gap-2 text-sm">
        <span className={`font-bold ${style.text}`}>[{style.label}]</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
          {TYPE_LABELS[issue.type] || issue.type}
        </span>
        <span className="text-xs text-zinc-500">第{issue.chapter}章</span>
      </div>
      <p className="text-sm text-zinc-800 dark:text-zinc-200">{issue.description}</p>
      {issue.violatedFact && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          违反事实：{issue.violatedFact}
        </p>
      )}
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        建议：{issue.suggestion}
      </p>
    </div>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  step4: WizardStep4;
  onNext: () => void;
  onPrev: () => void;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Step5_VolumeOutline({ projectId, step4, onNext, onPrev }: Props) {
  // ── Master outline ─────────────────────────────────────────────────────────
  const [masterVolumes, setMasterVolumes] = useState<MasterVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/wizard/master-outline`)
      .then((r) => r.json())
      .then((d) => {
        if (d.exists && Array.isArray(d.volumes) && d.volumes.length > 0) {
          setMasterVolumes([...d.volumes].sort((a, b) => a.volumeNum - b.volumeNum));
        } else {
          // Fallback: use step4 state if API returns nothing
          setMasterVolumes(
            step4.volumes
              .slice()
              .sort((a, b) => a.volumeNum - b.volumeNum)
              .map((v) => ({
                volumeNum: v.volumeNum,
                volumeTitle: v.volumeTitle,
                chapterRange: v.chapterRange,
                coreConflict: v.coreConflict,
                mainPlot: v.mainPlot,
                systemPhase: v.systemPhase,
                pleasureType: v.pleasureType,
                keyTurningPoints: v.keyTurningPoints,
                emotionalArc: v.emotionalArc,
              }))
          );
        }
      })
      .catch(() => setLoadError('加载全书大纲失败，请刷新重试'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Per-volume state ────────────────────────────────────────────────────────
  const [volStates, setVolStates] = useState<Record<number, VolState>>({});
  const [activeVol, setActiveVol] = useState<number | null>(null);
  const [collapsedChapters, setCollapsedChapters] = useState<Record<number, boolean>>({});
  const [showFactsWarning, setShowFactsWarning] = useState(false);
  const [factsWarningVol, setFactsWarningVol] = useState<number | null>(null);
  const [factsMaxVol, setFactsMaxVol] = useState<number>(0);

  function getVolState(num: number): VolState {
    return volStates[num] ?? DEFAULT_VOL_STATE;
  }

  function patchVolState(num: number, patch: Partial<VolState>) {
    setVolStates((prev) => ({
      ...prev,
      [num]: { ...(prev[num] ?? DEFAULT_VOL_STATE), ...patch },
    }));
  }

  function updateChapter(volNum: number, chapterNum: number, patch: Partial<GeneratedChapter>) {
    setVolStates((prev) => {
      const vs = prev[volNum] ?? DEFAULT_VOL_STATE;
      return {
        ...prev,
        [volNum]: {
          ...vs,
          chapters: vs.chapters.map((c) =>
            c.chapterNum === chapterNum ? { ...c, ...patch } : c
          ),
        },
      };
    });
  }

  // ── Batch generation runner ────────────────────────────────────────────────
  /**
   * Generates batches sequentially starting from `fromBatchIdx`.
   * `accumulated` holds chapters already generated by prior successful batches.
   */
  async function runBatches(
    vol: MasterVolume,
    batches: Array<{ start: number; end: number }>,
    fromBatchIdx: number,
    accumulated: GeneratedChapter[],
    volumeSummary: string
  ) {
    const total = batches.length;
    const all = [...accumulated];

    for (let i = fromBatchIdx; i < total; i++) {
      const batch = batches[i];

      // Update progress text before each batch request
      patchVolState(vol.volumeNum, {
        batchProgress: `正在生成第${batch.start}-${batch.end}章（第${i + 1}批/共${total}批）…`,
        batchDone: i,
      });

      try {
        const r = await fetch(`/api/projects/${projectId}/generate-outline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            volumeNum: vol.volumeNum,
            volumeTitle: vol.volumeTitle,
            startChapter: batch.start,
            endChapter: batch.end,
            volumeSummary,
            characters: [],
            constraints: '',
          }),
        });

        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);

        const newChapters: GeneratedChapter[] = Array.isArray(d?.chapters) ? d.chapters : [];
        all.push(...newChapters);

        // Persist accumulated chapters so far
        patchVolState(vol.volumeNum, {
          chapters: [...all],
          batchDone: i + 1,
        });
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : '未知错误';
        patchVolState(vol.volumeNum, {
          status: 'preview',
          chapters: [...all],
          batchProgress: '',
          error: `第${i + 1}批（第${batch.start}~${batch.end}章）生成失败：${errMsg}`,
          failedBatch: { batchIdx: i, start: batch.start, end: batch.end },
        });
        return; // stop — user can retry this batch
      }
    }

    // All batches succeeded
    const initCollapsed: Record<number, boolean> = {};
    all.forEach((c, idx) => {
      initCollapsed[c.chapterNum] = idx >= 3;
    });
    setCollapsedChapters((prev) => ({ ...prev, ...initCollapsed }));

    patchVolState(vol.volumeNum, {
      status: 'auditing',
      chapters: all,
      batchProgress: '',
      error: '',
      failedBatch: null,
      batchDone: total,
      auditReport: null,
      auditError: '',
    });

    // Auto-trigger StoryGuard audit
    try {
      const chapterNumbers = all.map(c => c.chapterNum);
      const r = await fetch(`/api/projects/${projectId}/audit-outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumbers }),
      });
      const report = await r.json();
      if (r.ok) {
        patchVolState(vol.volumeNum, {
          status: 'preview',
          auditReport: report as AuditReport,
        });
      } else {
        patchVolState(vol.volumeNum, {
          status: 'preview',
          auditError: `审计失败：${report?.error || `HTTP ${r.status}`}`,
        });
      }
    } catch (e) {
      patchVolState(vol.volumeNum, {
        status: 'preview',
        auditError: `审计请求失败：${e instanceof Error ? e.message : '未知错误'}`,
      });
    }
  }

  // ── Facts check before generation ──────────────────────────────────────────

  async function executeGeneration(vol: MasterVolume) {
    const range = parseChapterRange(vol.chapterRange);
    if (!range) {
      patchVolState(vol.volumeNum, {
        error: `无法解析章节范围"${vol.chapterRange}"，请返回第4步修正（格式示例：1-50）`,
      });
      return;
    }

    const batches = buildBatches(range.start, range.end);
    const volumeSummary = buildVolumeSummary(vol);

    patchVolState(vol.volumeNum, {
      status: 'generating',
      chapters: [],
      error: '',
      batchTotal: batches.length,
      batchDone: 0,
      batchProgress: `正在生成第${batches[0].start}-${batches[0].end}章（第1批/共${batches.length}批）…`,
      failedBatch: null,
    });

    await runBatches(vol, batches, 0, [], volumeSummary);
  }

  async function checkFactsBeforeGenerate(volNum: number): Promise<boolean> {
    // 第1卷不需要检查
    if (volNum === 1) return true;

    try {
      const response = await fetch(`/api/projects/${projectId}/knowledge/facts`);
      const data: FactsApiResponse = await response.json();

      // facts.json 不存在
      if (!data.exists) {
        setFactsWarningVol(volNum);
        setFactsMaxVol(0);
        setShowFactsWarning(true);
        return false;
      }

      // 计算 facts 数据覆盖的最大卷号
      let maxVol = 0;

      // 检查角色的 lastSeenVolume
      if (data.characters) {
        Object.values(data.characters).forEach((char) => {
          if ((char?.lastSeenVolume ?? 0) > maxVol) {
            maxVol = char.lastSeenVolume;
          }
        });
      }

      // 检查 majorEvents 的 volume
      if (Array.isArray(data.majorEvents)) {
        data.majorEvents.forEach((event) => {
          if ((event?.volume ?? 0) > maxVol) {
            maxVol = event.volume;
          }
        });
      }

      // 检查 revealedInfo 的 volume
      if (Array.isArray(data.revealedInfo)) {
        data.revealedInfo.forEach((info) => {
          if ((info?.volume ?? 0) > maxVol) {
            maxVol = info.volume;
          }
        });
      }

      // 检查技术线的 asOfVolume
      if (data.techLines) {
        Object.values(data.techLines).forEach((tech) => {
          if ((tech?.asOfVolume ?? 0) > maxVol) {
            maxVol = tech.asOfVolume;
          }
        });
      }

      // 检查势力的 asOfVolume
      if (data.factions) {
        Object.values(data.factions).forEach((faction) => {
          if ((faction?.asOfVolume ?? 0) > maxVol) {
            maxVol = faction.asOfVolume;
          }
        });
      }

      // 如果最大卷号 < 当前要生成的卷号 - 1，显示警告
      if (maxVol < volNum - 1) {
        setFactsWarningVol(volNum);
        setFactsMaxVol(maxVol);
        setShowFactsWarning(true);
        return false;
      }

      return true;
    } catch (err) {
      console.error('检查事实注册表失败:', err);
      // 检查失败不阻断，允许继续
      return true;
    }
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleGenerate(vol: MasterVolume) {
    // 卷前检测
    const canProceed = await checkFactsBeforeGenerate(vol.volumeNum);
    if (!canProceed) return;

    await executeGeneration(vol);
  }

  async function handleRetryBatch(vol: MasterVolume) {
    const vs = getVolState(vol.volumeNum);
    const fb = vs.failedBatch;
    if (!fb) return;

    const range = parseChapterRange(vol.chapterRange);
    if (!range) return;

    const batches = buildBatches(range.start, range.end);
    const volumeSummary = buildVolumeSummary(vol);
    const existingChapters = vs.chapters; // chapters from already-succeeded batches

    patchVolState(vol.volumeNum, {
      status: 'generating',
      error: '',
      batchTotal: batches.length,
      batchDone: fb.batchIdx,
      batchProgress: `重试第${fb.start}-${fb.end}章（第${fb.batchIdx + 1}批/共${batches.length}批）…`,
      failedBatch: null,
    });

    await runBatches(vol, batches, fb.batchIdx, existingChapters, volumeSummary);
  }

  async function handleSave(vol: MasterVolume) {
    const vs = getVolState(vol.volumeNum);
    if (!vs.chapters.length) return;

    patchVolState(vol.volumeNum, { status: 'saving', error: '' });

    try {
      const r = await fetch(`/api/projects/${projectId}/generate-outline/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volumeNum: vol.volumeNum,
          volumeTitle: vol.volumeTitle,
          chapters: vs.chapters,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || '保存失败');

      patchVolState(vol.volumeNum, { status: 'saved' });

      // Auto-select next unfinished volume
      const nextVol = masterVolumes.find(
        (v) => v.volumeNum !== vol.volumeNum && volStates[v.volumeNum]?.status !== 'saved'
      );
      setActiveVol(nextVol?.volumeNum ?? null);
    } catch (e) {
      patchVolState(vol.volumeNum, {
        status: 'preview',
        error: `保存失败：${e instanceof Error ? e.message : '未知错误'}`,
      });
    }
  }

  // ── Audit handler ─────────────────────────────────────────────────────────

  async function handleAudit(vol: MasterVolume) {
    const vs = getVolState(vol.volumeNum);
    if (!vs.chapters.length) return;

    patchVolState(vol.volumeNum, {
      status: 'auditing',
      auditReport: null,
      auditError: '',
      showIgnoreConfirm: false,
    });

    try {
      const chapterNumbers = vs.chapters.map(c => c.chapterNum);
      const r = await fetch(`/api/projects/${projectId}/audit-outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNumbers }),
      });
      const report = await r.json();

      if (!r.ok) throw new Error(report?.error || `HTTP ${r.status}`);

      patchVolState(vol.volumeNum, {
        status: 'preview',
        auditReport: report as AuditReport,
      });
    } catch (e) {
      patchVolState(vol.volumeNum, {
        status: 'preview',
        auditError: `审计失败：${e instanceof Error ? e.message : '未知错误'}`,
      });
    }
  }

  async function handleAutoFix(vol: MasterVolume) {
    const vs = getVolState(vol.volumeNum);
    const report = vs.auditReport;
    if (!report || !report.issues.length) return;

    // 找出有问题的章节号
    const problemChapterNums = new Set(report.issues.map(i => i.chapter));
    const range = parseChapterRange(vol.chapterRange);
    if (!range) return;

    // 只重新生成有问题的章节所在的batch
    const volumeSummary = buildVolumeSummary(vol);
    const okChapters = vs.chapters.filter(c => !problemChapterNums.has(c.chapterNum));

    patchVolState(vol.volumeNum, {
      status: 'generating',
      auditReport: null,
      auditError: '',
      error: '',
      batchProgress: `正在重新生成有问题的 ${problemChapterNums.size} 个章节…`,
      batchTotal: 1,
      batchDone: 0,
      failedBatch: null,
    });

    try {
      // 找出有问题的章节的连续范围
      const problemNums = Array.from(problemChapterNums).sort((a, b) => a - b);
      const batchStart = problemNums[0];
      const batchEnd = problemNums[problemNums.length - 1];

      const r = await fetch(`/api/projects/${projectId}/generate-outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volumeNum: vol.volumeNum,
          volumeTitle: vol.volumeTitle,
          startChapter: batchStart,
          endChapter: batchEnd,
          volumeSummary,
          characters: [],
          constraints: '',
        }),
      });

      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);

      const newChapters: GeneratedChapter[] = Array.isArray(d?.chapters) ? d.chapters : [];
      // 合并：用新生成的替换有问题的
      const newChapterMap = new Map(newChapters.map(c => [c.chapterNum, c]));
      const mergedChapters = vs.chapters.map(c =>
        newChapterMap.has(c.chapterNum) ? newChapterMap.get(c.chapterNum)! : c
      );
      // 如果新生成的有原来不存在的章节，也加上
      for (const nc of newChapters) {
        if (!mergedChapters.find(c => c.chapterNum === nc.chapterNum)) {
          mergedChapters.push(nc);
        }
      }
      mergedChapters.sort((a, b) => a.chapterNum - b.chapterNum);

      patchVolState(vol.volumeNum, {
        status: 'preview',
        chapters: mergedChapters,
        batchProgress: '',
        error: '',
        failedBatch: null,
      });

      // 自动触发重新审计
      // 使用 setTimeout 确保 state 更新后再执行
      setTimeout(() => handleAudit(vol), 100);
    } catch (e) {
      patchVolState(vol.volumeNum, {
        status: 'preview',
        batchProgress: '',
        error: `自动修复失败：${e instanceof Error ? e.message : '未知错误'}`,
      });
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const savedCount = masterVolumes.filter((v) => getVolState(v.volumeNum).status === 'saved').length;
  const totalCount = masterVolumes.length;
  const allDone = totalCount > 0 && savedCount === totalCount;

  // ── Loading / error guards ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm text-gray-400">正在加载全书大纲…</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-red-500 text-sm">{loadError}</p>
        <button
          onClick={onPrev}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          ← 返回上一步
        </button>
      </div>
    );
  }

  if (masterVolumes.length === 0) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          未找到全书大纲，请先完成第4步「故事骨架」
        </p>
        <button
          onClick={onPrev}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          ← 返回第4步
        </button>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">分卷细纲生成</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          点击每一卷，AI 将根据全书大纲自动分批生成该卷的分章细纲
        </p>
      </div>

      {/* Facts Warning Modal */}
      {showFactsWarning && factsWarningVol && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
                <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  事实注册表可能未更新到最新卷
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {factsMaxVol === 0 
                    ? `尚未创建事实注册表，您即将生成第 ${factsWarningVol} 卷的细纲。`
                    : `当前事实数据最后覆盖到第 ${factsMaxVol} 卷，您即将生成第 ${factsWarningVol} 卷的细纲。`
                  }
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  建议先更新事实注册表，以确保 StoryGuard 防幻觉系统能有效检测一致性问题。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  window.open(`/projects/${projectId}/knowledge?tab=facts`, '_blank');
                }}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                更新事实注册表
              </button>
              <button
                onClick={() => {
                  setShowFactsWarning(false);
                  const vol = masterVolumes.find(v => v.volumeNum === factsWarningVol);
                  if (vol) {
                    void executeGeneration(vol);
                  }
                }}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                跳过，直接生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overall progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: totalCount > 0 ? `${(savedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 shrink-0">
          {savedCount} / {totalCount} 卷已完成
        </span>
      </div>

      {/* Volume cards */}
      <div className="space-y-3">
        {masterVolumes.map((vol) => {
          const vs = getVolState(vol.volumeNum);
          const isActive = activeVol === vol.volumeNum;
          const isSaved = vs.status === 'saved';
          const isGenerating = vs.status === 'generating';

          return (
            <div
              key={vol.volumeNum}
              className={`border rounded-lg overflow-hidden transition-colors ${
                isSaved
                  ? 'border-green-300 dark:border-green-700'
                  : isActive
                  ? 'border-blue-300 dark:border-blue-700'
                  : 'border-gray-200 dark:border-zinc-800'
              } bg-white dark:bg-zinc-900`}
            >
              {/* Card header — always visible */}
              <button
                onClick={() => setActiveVol(isActive ? null : vol.volumeNum)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isSaved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
                  }`}
                >
                  {isSaved ? '✓' : vol.volumeNum}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    第{vol.volumeNum}卷：{vol.volumeTitle}
                  </div>
                  {vol.chapterRange && (
                    <div className="text-xs text-gray-400 mt-0.5">{vol.chapterRange}</div>
                  )}
                </div>
                {isSaved && (
                  <span className="text-xs text-green-600 dark:text-green-400 shrink-0 font-medium">
                    细纲已完成
                  </span>
                )}
                {isGenerating && (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                <span className="text-gray-400 text-xs shrink-0">{isActive ? '▲' : '▼'}</span>
              </button>

              {/* Expanded content */}
              {isActive && (
                <div className="border-t dark:border-zinc-800 p-4 space-y-4">
                  {/* Volume info summary */}
                  <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-md p-3 space-y-2 text-sm">
                    {vol.coreConflict && (
                      <div>
                        <span className="text-xs text-gray-400">核心冲突：</span>
                        <span className="text-zinc-800 dark:text-zinc-200 ml-1">{vol.coreConflict}</span>
                      </div>
                    )}
                    {vol.mainPlot && (
                      <div>
                        <span className="text-xs text-gray-400">主线推进：</span>
                        <span className="text-zinc-800 dark:text-zinc-200 ml-1">{vol.mainPlot}</span>
                      </div>
                    )}
                    {(vol.systemPhase || vol.keyTurningPoints) && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t dark:border-zinc-700">
                        {vol.systemPhase && (
                          <div>
                            <span className="text-xs text-gray-400">体系阶段：</span>
                            <span className="text-zinc-700 dark:text-zinc-300 ml-1 text-xs">
                              {vol.systemPhase}
                            </span>
                          </div>
                        )}
                        {vol.keyTurningPoints && (
                          <div>
                            <span className="text-xs text-gray-400">关键转折：</span>
                            <span className="text-zinc-700 dark:text-zinc-300 ml-1 text-xs">
                              {vol.keyTurningPoints}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Auditing state ── */}
                  {vs.status === 'auditing' && (
                    <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-md p-4">
                      <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                        StoryGuard 正在审计叙事一致性…
                      </span>
                    </div>
                  )}

                  {/* ── Generating state ── */}
                  {isGenerating && (
                    <div className="space-y-2 bg-purple-50 dark:bg-purple-950/30 rounded-md p-4">
                      {/* Batch progress bar */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
                        <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                          {vs.batchProgress}
                        </span>
                      </div>
                      {vs.batchTotal > 1 && (
                        <>
                          <div className="flex-1 h-1.5 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all duration-300"
                              style={{
                                width: `${(vs.batchDone / vs.batchTotal) * 100}%`,
                              }}
                            />
                          </div>
                          <div className="text-xs text-purple-500 dark:text-purple-400">
                            {vs.batchDone}/{vs.batchTotal} 批已完成
                            {vs.chapters.length > 0 && `，已积累 ${vs.chapters.length} 章`}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Idle: generate button ── */}
                  {vs.status === 'idle' && (
                    <button
                      onClick={() => handleGenerate(vol)}
                      className="w-full py-2.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
                    >
                      ✨ 为本卷生成分章细纲
                    </button>
                  )}

                  {/* ── Batch failure banner + retry ── */}
                  {vs.failedBatch && (
                    <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 space-y-2">
                      <p className="text-sm text-red-600 dark:text-red-400">{vs.error}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRetryBatch(vol)}
                          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          ↺ 重试本批（第{vs.failedBatch.batchIdx + 1}批）
                        </button>
                        <button
                          onClick={() => handleGenerate(vol)}
                          className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          从头重新生成
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Preview: chapter list + save ── */}
                  {(vs.status === 'preview' || vs.status === 'saving' || vs.status === 'auditing') &&
                    vs.chapters.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {vs.failedBatch
                              ? `已生成 ${vs.chapters.length} 章（部分批次失败，请重试后再保存）`
                              : `已生成 ${vs.chapters.length} 章，请审核后保存`}
                          </p>
                          {!vs.failedBatch && (
                            <button
                              onClick={() => handleGenerate(vol)}
                              className="text-xs px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                            >
                              ↺ 从头重新生成
                            </button>
                          )}
                        </div>
                        <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                          {vs.chapters.map((ch) => (
                            <ChapterCard
                              key={ch.chapterNum}
                              ch={ch}
                              collapsed={collapsedChapters[ch.chapterNum] ?? false}
                              onToggle={() =>
                                setCollapsedChapters((prev) => ({
                                  ...prev,
                                  [ch.chapterNum]: !prev[ch.chapterNum],
                                }))
                              }
                              onChange={(patch) =>
                                updateChapter(vol.volumeNum, ch.chapterNum, patch)
                              }
                            />
                          ))}
                        </div>
                        {/* ── Audit report display ── */}
                        {vs.auditReport && (
                          <div className="space-y-3">
                            {vs.auditReport.passed ? (
                              <div className="rounded-md border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30 p-3 flex items-center gap-2">
                                <span className="text-green-600 dark:text-green-400 text-lg">&#10003;</span>
                                <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                                  StoryGuard 审计通过 — 未发现叙事一致性问题
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="rounded-md border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-3">
                                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                    StoryGuard 发现 {vs.auditReport.totalIssues} 个问题
                                    {vs.auditReport.criticalCount > 0 && (
                                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200">
                                        {vs.auditReport.criticalCount} 严重
                                      </span>
                                    )}
                                    {vs.auditReport.warningCount > 0 && (
                                      <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200">
                                        {vs.auditReport.warningCount} 警告
                                      </span>
                                    )}
                                  </p>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {[...vs.auditReport.issues]
                                    .sort((a, b) => {
                                      const order = { critical: 0, warning: 1, info: 2 };
                                      return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
                                    })
                                    .map((issue, idx) => (
                                      <AuditIssueCard key={idx} issue={issue} />
                                    ))}
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => handleAutoFix(vol)}
                                    className="flex-1 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
                                  >
                                    AI 自动修复问题章节
                                  </button>
                                  <button
                                    onClick={() => handleAudit(vol)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                  >
                                    重新审计
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Audit error (non-blocking) */}
                        {vs.auditError && (
                          <div className="rounded-md border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 p-3 space-y-2">
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">{vs.auditError}</p>
                            <button
                              onClick={() => handleAudit(vol)}
                              className="text-xs px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
                            >
                              重试审计
                            </button>
                          </div>
                        )}

                        {/* Save buttons — show when no batch failure */}
                        {!vs.failedBatch && (
                          <div className="space-y-2">
                            {/* If audit failed with issues, show "忽略并保存" with confirmation */}
                            {vs.auditReport && !vs.auditReport.passed ? (
                              <>
                                {vs.showIgnoreConfirm ? (
                                  <div className="rounded-md border border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30 p-3 space-y-2">
                                    <p className="text-sm text-orange-700 dark:text-orange-300">
                                      确认忽略 {vs.auditReport.criticalCount} 个严重问题和 {vs.auditReport.warningCount} 个警告？
                                    </p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleSave(vol)}
                                        disabled={vs.status === 'saving'}
                                        className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded text-sm font-medium transition-colors"
                                      >
                                        {vs.status === 'saving' ? '保存中…' : '确认忽略并保存'}
                                      </button>
                                      <button
                                        onClick={() => patchVolState(vol.volumeNum, { showIgnoreConfirm: false })}
                                        className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                      >
                                        取消
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => patchVolState(vol.volumeNum, { showIgnoreConfirm: true })}
                                    className="w-full py-2.5 rounded-md border border-orange-400 dark:border-orange-600 text-orange-600 dark:text-orange-400 text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                                  >
                                    忽略问题并保存
                                  </button>
                                )}
                              </>
                            ) : (
                              <button
                                onClick={() => handleSave(vol)}
                                disabled={vs.status === 'saving'}
                                className="w-full py-2.5 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                              >
                                {vs.status === 'saving' ? '保存中…' : '&#10003; 确认并保存到细纲'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  {/* ── Error (non-batch, e.g. range parse error) ── */}
                  {vs.error && !vs.failedBatch && vs.status === 'idle' && (
                    <p className="text-sm text-red-500">{vs.error}</p>
                  )}

                  {/* ── Saved state ── */}
                  {vs.status === 'saved' && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        ✓ 第{vol.volumeNum}卷细纲已保存（{vs.chapters.length} 章）
                      </p>
                      <button
                        onClick={() =>
                          patchVolState(vol.volumeNum, {
                            ...DEFAULT_VOL_STATE,
                            status: 'idle',
                          })
                        }
                        className="text-xs px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                      >
                        重新生成
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onPrev}
          className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ← 上一步
        </button>
        <div className="flex gap-3">
          {savedCount > 0 && !allDone && (
            <button
              onClick={onNext}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              跳过剩余卷
            </button>
          )}
          <button
            onClick={onNext}
            disabled={savedCount === 0}
            className={`px-6 py-2.5 rounded-md font-medium transition-colors ${
              allDone
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : savedCount > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {allDone ? '全部完成，下一步 →' : savedCount > 0 ? '继续下一步 →' : '请先生成至少一卷'}
          </button>
        </div>
      </div>
    </div>
  );
}
