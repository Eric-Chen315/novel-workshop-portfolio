"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "@/lib/toast";

// ─── 全书战略大纲类型 ──────────────────────────────────────────────────────────

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

const MASTER_FIELDS: { key: keyof MasterVolume; label: string }[] = [
  { key: 'systemPhase',     label: '体系阶段' },
  { key: 'pleasureType',    label: '爽点类型' },
  { key: 'keyTurningPoints', label: '关键转折' },
  { key: 'emotionalArc',    label: '情绪弧线' },
];

function MasterVolumeCard({
  vol,
  defaultOpen,
}: {
  vol: MasterVolume;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className="border rounded-lg bg-white dark:bg-zinc-900 overflow-hidden dark:border-zinc-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-zinc-950 border-b dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors text-left"
      >
        <span className="text-gray-400 text-xs w-4">{open ? '▼' : '▶'}</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100 flex-1">
          第{vol.volumeNum}卷：{vol.volumeTitle}
          {vol.chapterRange && (
            <span className="ml-2 text-xs text-gray-400 font-normal">{vol.chapterRange}</span>
          )}
        </span>
      </button>
      <div className={open ? 'p-4 space-y-3' : 'hidden'}>
        {/* 核心冲突 + 主线推进（始终可见的主字段） */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <div className="text-xs text-gray-400 mb-1">核心冲突</div>
            <div className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
              {vol.coreConflict || <span className="text-gray-300 dark:text-gray-600 italic">（未填写）</span>}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">主线推进</div>
            <div className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
              {vol.mainPlot || <span className="text-gray-300 dark:text-gray-600 italic">（未填写）</span>}
            </div>
          </div>
        </div>
        {/* 其余字段 */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 border-t dark:border-zinc-800 pt-3">
          {MASTER_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                {vol[key] || <span className="text-gray-300 dark:text-gray-600 italic">—</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type OutlineChapter = {
  chapterNum: number;
  title: string;
  dayMarker?: string;
  plotSummary?: string;
  summary?: string;
  status?: string;
  rawContent?: string;
  corePurpose?: string;
  plotPoints?: string[];
  keyCharacters?: string[];
  emotionalArc?: string | {
    start?: string;
    mid?: string;
    end?: string;
    intensity?: number | string;
  };
  endHook?: string;
  connectionToPrev?: string;
  connectionToNext?: string;
  mustInclude?: string[];
  suggestedWordCount?: number;
  wordCountGuide?: string;
};

type OutlineVolume = {
  volumeNum?: number;
  title: string;
  summary?: string;
  chapters: OutlineChapter[];
};

// 计算章节范围
function getChapterRange(chapters: OutlineChapter[]): string {
  if (!chapters || chapters.length === 0) return "";
  const nums = chapters.map(c => c.chapterNum).filter(n => typeof n === 'number');
  if (nums.length === 0) return "";
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return `（${min}-${max}章）`;
}

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

type ChapterSectionKey =
  | "corePurpose"
  | "plotPoints"
  | "keyCharacters"
  | "emotionalArc"
  | "endHook"
  | "connectionToPrev"
  | "connectionToNext"
  | "mustInclude"
  | "suggestedWordCount";

const DETAIL_FIELD_META: Array<{ key: ChapterSectionKey; label: string }> = [
  { key: "corePurpose", label: "核心功能" },
  { key: "plotPoints", label: "情节点" },
  { key: "keyCharacters", label: "关键角色" },
  { key: "emotionalArc", label: "情绪弧线" },
  { key: "endHook", label: "章末钩子" },
  { key: "connectionToPrev", label: "与上一章衔接" },
  { key: "connectionToNext", label: "为下一章埋线" },
  { key: "mustInclude", label: "必须包含" },
  { key: "suggestedWordCount", label: "字数建议" },
];

const MARKERS = DETAIL_FIELD_META.map((field) => `【${field.label}】`);

const RAW_SECTION_ALIASES: Record<string, ChapterSectionKey> = {
  "核心功能": "corePurpose",
  "核心目的": "corePurpose",
  "情节点": "plotPoints",
  "关键角色": "keyCharacters",
  "情绪弧线": "emotionalArc",
  "章末钩子": "endHook",
  "与上一章衔接": "connectionToPrev",
  "为下一章埋线": "connectionToNext",
  "与下一章衔接": "connectionToNext",
  "必须包含": "mustInclude",
  "字数建议": "suggestedWordCount",
};

type ParsedChapterSections = Record<ChapterSectionKey, string>;

type OutlineFormState = {
  volumeNum: number;
  volumeTitle: string;
  startChapter: number;
  endChapter: number;
  volumeSummary: string;
  constraints: string;
};

const OUTLINE_FORM_FIELDS: Array<{
  label: string;
  key: "volumeNum" | "volumeTitle" | "startChapter" | "endChapter";
  type: "number" | "text";
}> = [
  { label: "卷号", key: "volumeNum", type: "number" },
  { label: "卷名", key: "volumeTitle", type: "text" },
  { label: "起始章节", key: "startChapter", type: "number" },
  { label: "结束章节", key: "endChapter", type: "number" },
];

function cleanLineArray(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim().replace(/^-\s*/, ""))
    .filter(Boolean);
}

function extractSection(text: string, marker: string): string {
  const startIdx = text.indexOf(marker);
  if (startIdx === -1) return "";

  const contentStart = startIdx + marker.length;
  let nearestEnd = text.length;

  for (const nextMarker of MARKERS) {
    if (nextMarker === marker) continue;
    const idx = text.indexOf(nextMarker, contentStart);
    if (idx !== -1 && idx < nearestEnd) {
      nearestEnd = idx;
    }
  }

  return text.substring(contentStart, nearestEnd).trim();
}

function extractNumber(text: string): number | undefined {
  const match = text.match(/(\d{1,6})/);
  return match ? parseInt(match[1], 10) : undefined;
}

function parseMustInclude(text: string): string[] {
  if (!text.trim()) return [];

  const lines = text.split(/\n/);
  const items: string[] = [];

  for (const line of lines) {
    const cleaned = line
      .replace(/^\s*[\d]+[.、)）]\s*/, "")
      .replace(/^\s*[①②③④⑤⑥⑦⑧⑨⑩]\s*/, "")
      .replace(/^\s*[-•·*]\s*/, "")
      .trim();

    if (cleaned) items.push(cleaned);
  }

  if (items.length === 1 && items[0].length > 60) {
    const subItems = items[0].split(/[、；;]/).map((item) => item.trim()).filter(Boolean);
    if (subItems.length >= 3) return subItems;
  }

  return items;
}

function parseChapterEditorText(text: string): ParsedChapterSections {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const parsed: ParsedChapterSections = {
    corePurpose: extractSection(normalized, "【核心功能】"),
    plotPoints: extractSection(normalized, "【情节点】"),
    keyCharacters: extractSection(normalized, "【关键角色】"),
    emotionalArc: extractSection(normalized, "【情绪弧线】"),
    endHook: extractSection(normalized, "【章末钩子】"),
    connectionToPrev: extractSection(normalized, "【与上一章衔接】"),
    connectionToNext: extractSection(normalized, "【为下一章埋线】") || extractSection(normalized, "【与下一章衔接】"),
    mustInclude: extractSection(normalized, "【必须包含】"),
    suggestedWordCount: extractSection(normalized, "【字数建议】"),
  };

  if (Object.values(parsed).some((value) => value.trim())) {
    return parsed;
  }

  const matches = [...normalized.matchAll(/【([^】]+)】\s*([\s\S]*?)(?=\n【[^】]+】|$)/g)];
  matches.forEach((match) => {
    const key = RAW_SECTION_ALIASES[match[1].trim()];
    if (!key) return;
    parsed[key] = match[2].trim();
  });

  return parsed;
}

function buildChapterEditText(chapter: OutlineChapter) {
  const sectionList = parseChapterToSections(chapter);
  const lines: string[] = [];
  DETAIL_FIELD_META.forEach((field) => {
    const rawValue = sectionList.find((section) => section.key === field.key)?.value.trim() || "";
    if (!rawValue) return;
    lines.push(`【${field.label}】\n${rawValue}`);
  });
  return lines.join("\n\n");
}

function formatEmotionalArc(
  value: OutlineChapter["emotionalArc"]
): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();

  const start = value.start?.trim();
  const mid = value.mid?.trim();
  const end = value.end?.trim();
  const intensity = value.intensity;

  const segments = [
    start ? `起：${start}` : "",
    mid ? `中：${mid}` : "",
    end ? `终：${end}` : "",
  ].filter(Boolean);

  const intensityText =
    intensity !== undefined && intensity !== null && String(intensity).trim()
      ? `（强度：${String(intensity).trim()}）`
      : "";

  if (segments.length === 0) return intensityText.replace(/[（）]/g, "");
  return `${segments.join(" → ")}${intensityText}`;
}

function parseChapterToSections(chapter: OutlineChapter) {
  const structured: ParsedChapterSections = {
    corePurpose: chapter.corePurpose || chapter.summary || "",
    plotPoints: Array.isArray(chapter.plotPoints) ? chapter.plotPoints.join("\n") : chapter.plotSummary || "",
    keyCharacters: Array.isArray(chapter.keyCharacters) ? chapter.keyCharacters.join("、") : "",
    emotionalArc: formatEmotionalArc(chapter.emotionalArc),
    endHook: chapter.endHook || "",
    connectionToPrev: chapter.connectionToPrev || "",
    connectionToNext: chapter.connectionToNext || "",
    mustInclude: Array.isArray(chapter.mustInclude) ? chapter.mustInclude.join("\n") : "",
    suggestedWordCount:
      typeof chapter.suggestedWordCount === "number"
        ? String(chapter.suggestedWordCount)
        : typeof chapter.wordCountGuide === "string"
          ? chapter.wordCountGuide.replace(/[^\d]/g, "")
          : "",
  };

  const raw = (chapter.rawContent || "").trim();
  if (raw) {
    const parsedFromRaw = parseChapterEditorText(raw);
    (Object.keys(parsedFromRaw) as ChapterSectionKey[]).forEach((key) => {
      if (!structured[key].trim() && parsedFromRaw[key].trim()) {
        structured[key] = parsedFromRaw[key].trim();
      }
    });
  }

  return DETAIL_FIELD_META.map((field) => ({
    ...field,
    value: structured[field.key].trim(),
  })).filter((item) => item.value);
}

// SECTION: component
export function OutlineManager({ projectId }: { projectId: string }) {
  const { toast } = useToast();

  // ── 全书战略大纲 ──────────────────────────────────────────────────────────
  const [masterVolumes, setMasterVolumes] = useState<MasterVolume[]>([]);
  const [masterExists, setMasterExists] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/wizard/master-outline`)
      .then((r) => r.json())
      .then((d) => {
        setMasterExists(!!d.exists);
        setMasterVolumes(Array.isArray(d.volumes) ? d.volumes : []);
      })
      .catch(() => {});
  }, [projectId]);

  // ── 分章细纲 ──────────────────────────────────────────────────────────────
  const [volumes, setVolumes] = useState<OutlineVolume[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // 章节展开状态（用于显示章节内容）
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [chapterContents, setChapterContents] = useState<Record<number, string>>({});
  const [editingChapter, setEditingChapter] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [savingChapter, setSavingChapter] = useState(false);

  // 批量导入
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [selectedVolumeForImport, setSelectedVolumeForImport] = useState<number | "">("");

  // AI 生成新卷细纲
  const [outlineModalOpen, setOutlineModalOpen] = useState(false);
  const [mode, setMode] = useState<"form" | "preview">("form");
  const [form, setForm] = useState<OutlineFormState>({
    volumeNum: 4,
    volumeTitle: "",
    startChapter: 1,
    endChapter: 1,
    volumeSummary: "",
    constraints: "",
  });
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedChapter[]>([]);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  // ── 导出全书战略大纲 ──────────────────────────────────────────────────────
  const handleExportMasterOutline = () => {
    if (!masterVolumes.length) return;
    const lines: string[] = ['全书战略大纲', '='.repeat(40)];
    [...masterVolumes].sort((a, b) => a.volumeNum - b.volumeNum).forEach(vol => {
      lines.push('');
      lines.push(`第${vol.volumeNum}卷：${vol.volumeTitle}${vol.chapterRange ? `  ${vol.chapterRange}` : ''}`);
      lines.push(`核心冲突：${vol.coreConflict || '（未填写）'}`);
      lines.push(`主线推进：${vol.mainPlot || '（未填写）'}`);
      lines.push(`体系阶段：${vol.systemPhase || '—'}`);
      lines.push(`爽点类型：${vol.pleasureType || '—'}`);
      lines.push(`关键转折：${vol.keyTurningPoints || '—'}`);
      lines.push(`情绪弧线：${vol.emotionalArc || '—'}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `master-outline-${projectId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── 导出分章细纲 ──────────────────────────────────────────────────────────
  const handleExportChapterOutline = () => {
    if (!volumes.length) return;
    const lines: string[] = ['分章详细细纲', '='.repeat(40)];
    sortedVolumes.forEach(vol => {
      const chRange = getChapterRange(vol.chapters);
      lines.push('');
      lines.push(`【${vol.volumeNum ? `第${vol.volumeNum}卷：${vol.title}` : vol.title}${chRange}】`);
      [...vol.chapters].sort((a, b) => a.chapterNum - b.chapterNum).forEach(ch => {
        lines.push('');
        lines.push(`第${ch.chapterNum}章：${ch.title}`);
        if (ch.rawContent) lines.push(ch.rawContent);
        else if (ch.plotSummary || ch.summary) lines.push(ch.plotSummary || ch.summary || '');
      });
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chapter-outline-${projectId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const refreshOutline = () => {
    fetch(`/api/projects/${projectId}/knowledge/outline`)
      .then((r) => r.json())
      .then((d) => setVolumes(d.volumes || []));
  };

  useEffect(() => { refreshOutline(); }, [projectId]); // eslint-disable-line

  useEffect(() => {
    if (!outlineModalOpen) return;
    fetch(`/api/projects/${projectId}/characters`)
      .then((r) => r.json())
      .then((d) => { const n = d?.names; setRoleOptions(Array.isArray(n) ? n : []); })
      .catch(() => setRoleOptions([]));
  }, [outlineModalOpen, projectId]);

  // 加载章节内容 - 从本地 volumes 数据中读取
  const loadChapterContent = (chapterNum: number) => {
    if (chapterContents[chapterNum]) return; // 已加载
    // 从本地 volumes 数据中查找 rawContent
    const chapter = volumes
      .flatMap(v => v.chapters)
      .find(c => c.chapterNum === chapterNum);
    const content = chapter?.rawContent || "";
    setChapterContents(prev => ({ ...prev, [chapterNum]: content }));
  };

  // 切换章节展开状态
  const toggleChapter = (chapterNum: number) => {
    if (expandedChapter === chapterNum) {
      setExpandedChapter(null);
      if (editingChapter === chapterNum) {
        setEditingChapter(null);
        setEditText("");
      }
    } else {
      setExpandedChapter(chapterNum);
      loadChapterContent(chapterNum);
    }
  };

  const sortedVolumes = useMemo(() => [...volumes].sort((a, b) => (a.volumeNum || 0) - (b.volumeNum || 0)), [volumes]);
  const vKey = (v: OutlineVolume) => String(v.volumeNum ?? v.title);

  const saveVolumesRemote = async (vols: OutlineVolume[]) => {
    const response = await fetch(`/api/projects/${projectId}/knowledge/outline`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ volumes: vols }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || `HTTP ${response.status}`);
    }
    return response.json();
  };

  const startEditingChapter = (chapter: OutlineChapter) => {
    setEditingChapter(chapter.chapterNum);
    setEditText(buildChapterEditText(chapter));
  };

  const cancelEditingChapter = () => {
    setEditingChapter(null);
    setEditText("");
  };

  const handleSaveChapter = async (chapterNum: number) => {
    const nextRawContent = editText.trim();
    const parsed = parseChapterEditorText(nextRawContent);
    const nextSuggestedWordCount = extractNumber(parsed.suggestedWordCount);
    const nextVolumes = volumes.map((volume) => ({
      ...volume,
      chapters: volume.chapters.map((chapter) => {
        if (chapter.chapterNum !== chapterNum) return chapter;
        const nextChapter: OutlineChapter = {
          ...chapter,
          summary: parsed.corePurpose.trim() || chapter.summary,
          plotSummary: parsed.plotPoints.trim() || chapter.plotSummary,
          corePurpose: parsed.corePurpose.trim(),
          plotPoints: cleanLineArray(parsed.plotPoints),
          keyCharacters: parsed.keyCharacters
            .split(/[、,，\n]/)
            .map((item) => item.trim())
            .filter(Boolean),
          emotionalArc: parsed.emotionalArc.trim(),
          endHook: parsed.endHook.trim(),
          connectionToPrev: parsed.connectionToPrev.trim(),
          connectionToNext: parsed.connectionToNext.trim(),
          mustInclude: parseMustInclude(parsed.mustInclude),
          suggestedWordCount: typeof nextSuggestedWordCount === "number" && Number.isFinite(nextSuggestedWordCount) ? nextSuggestedWordCount : undefined,
        };
        nextChapter.rawContent = nextRawContent;
        nextChapter.wordCountGuide = parsed.suggestedWordCount.trim();
        return nextChapter;
      }),
    }));

    setSavingChapter(true);
    try {
      await saveVolumesRemote(nextVolumes);
      setVolumes(nextVolumes);
      setChapterContents((prev) => ({ ...prev, [chapterNum]: nextRawContent }));
      cancelEditingChapter();
      toast(`第${chapterNum}章细纲已保存`, "success");
    } catch (error) {
      toast(`保存失败：${error instanceof Error ? error.message : "未知错误"}`, "error");
    } finally {
      setSavingChapter(false);
    }
  };

  const handleBatchImport = () => {
    if (!selectedVolumeForImport || !importText.trim()) return;
    const lines = importText.split("\n").filter((l) => l.trim());
    const vol = volumes.find((v) => v.volumeNum === selectedVolumeForImport);
    if (!vol) return;
    const maxNum = Math.max(0, ...vol.chapters.map((c) => c.chapterNum || 0));
    const newCh: OutlineChapter[] = lines.map((line, i) => ({
      chapterNum: maxNum + i + 1, title: line.trim(), plotSummary: "", status: "pending",
    }));
    const nv = volumes.map((v) => v.volumeNum === selectedVolumeForImport ? { ...v, chapters: [...v.chapters, ...newCh] } : v);
    setVolumes(nv); saveVolumesRemote(nv); setImportModalOpen(false); setImportText("");
  };

  const handleGenerate = async () => {
    if (!form.volumeTitle.trim()) return toast("请填写卷名", "error");
    if (!form.volumeSummary.trim()) return toast("请填写本卷概要", "error");
    if (form.startChapter > form.endChapter) return toast("起始章节不能大于结束章节", "error");
    setGenerating(true);
    try {
      const r = await fetch(`/api/projects/${projectId}/generate-outline`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volumeNum: +form.volumeNum, volumeTitle: form.volumeTitle,
          startChapter: +form.startChapter, endChapter: +form.endChapter,
          volumeSummary: form.volumeSummary, characters: selectedRoles, constraints: form.constraints }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);
      const chs: GeneratedChapter[] = Array.isArray(d?.chapters) ? d.chapters : [];
      setGenerated(chs);
      const init: Record<number, boolean> = {};
      chs.forEach((c) => (init[c.chapterNum] = c.chapterNum <= 3)); // 默认展开前3章
      setCollapsed(init); setMode("preview");
    } catch (e) { toast(`生成失败：${e instanceof Error ? e.message : "未知错误"}`, "error"); }
    finally { setGenerating(false); }
  };

  const handleSaveGenerated = async () => {
    try {
      const r = await fetch(`/api/projects/${projectId}/generate-outline/save`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volumeNum: +form.volumeNum, volumeTitle: form.volumeTitle, chapters: generated }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || `HTTP ${r.status}`);
      // 使用后端返回的消息，包含章节范围
      const message = d?.message || `已保存${generated.length}章细纲到大纲`;
      toast(message, "success");
      setOutlineModalOpen(false); refreshOutline();
    } catch (e) { toast(`保存失败：${e instanceof Error ? e.message : "未知错误"}`, "error"); }
  };

  const updCh = (num: number, p: Partial<GeneratedChapter>) =>
    setGenerated((prev) => prev.map((c) => (c.chapterNum === num ? { ...c, ...p } : c)));

  const inputCls = "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

  return (
    <div className="space-y-4">

      {/* ===== 全书战略大纲 ===== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide uppercase">
            全书战略大纲
          </h3>
          <div className="flex items-center gap-2">
            {masterVolumes.length > 0 && (
              <button
                onClick={handleExportMasterOutline}
                className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              >
                ↓ 导出全书大纲
              </button>
            )}
            <Link
              href={`/projects/new/wizard?projectId=${projectId}&step=4`}
              className="text-xs px-3 py-1.5 rounded border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
            >
              ✎ 编辑大纲
            </Link>
          </div>
        </div>

        {masterExists && masterVolumes.length > 0 ? (
          <div className="space-y-2">
            {[...masterVolumes]
              .sort((a, b) => a.volumeNum - b.volumeNum)
              .map((vol, idx) => (
                <MasterVolumeCard key={vol.volumeNum} vol={vol} defaultOpen={idx === 0} />
              ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-600 py-8 bg-white dark:bg-zinc-900 rounded border border-dashed dark:border-zinc-800 text-sm">
            暂无全书大纲 ·{' '}
            <Link
              href={`/projects/new/wizard?projectId=${projectId}&step=4`}
              className="text-blue-500 hover:underline"
            >
              前往向导生成
            </Link>
          </div>
        )}
      </div>

      {/* 分隔线 */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 border-t dark:border-zinc-800" />
        <span className="text-xs text-gray-400 dark:text-gray-600 shrink-0">分章详细细纲</span>
        <div className="flex-1 border-t dark:border-zinc-800" />
      </div>

      {/* toolbar */}
      <div className="flex justify-between items-center">
        <button onClick={() => setImportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          批量导入
        </button>
        <div className="flex items-center gap-2">
          {volumes.length > 0 && (
            <button
              onClick={handleExportChapterOutline}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-300 dark:border-zinc-700"
            >
              ↓ 导出分章细纲
            </button>
          )}
          <button onClick={() => { setMode("form"); setGenerated([]); setCollapsed({}); setSelectedRoles([]); setOutlineModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
            <span>✨</span> AI生成新卷细纲
          </button>
        </div>
      </div>

      {sortedVolumes.length === 0 && (
        <div className="text-center text-gray-500 py-12 bg-white dark:bg-zinc-900 rounded border dark:border-zinc-800">
          暂无卷，使用“AI生成新卷细纲”自动生成
        </div>
      )}

      {sortedVolumes.map((vol) => {
        const chapterRange = getChapterRange(vol.chapters);
        return (
        <div key={vKey(vol)} className="border rounded-lg bg-white dark:bg-zinc-900 overflow-hidden dark:border-zinc-800">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-zinc-950 border-b dark:border-zinc-800">
            <button onClick={() => setExpanded((p) => ({ ...p, [vKey(vol)]: !p[vKey(vol)] }))}
              className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded">
              {expanded[vKey(vol)] ? "▼" : "▶"}
            </button>
            <span className="font-medium text-zinc-900 dark:text-zinc-100 flex-1">
              {vol.volumeNum ? `第${vol.volumeNum}卷：${vol.title}${chapterRange}` : `${vol.title}${chapterRange}`}
            </span>
            <span className="text-gray-400 text-sm">({vol.chapters.length}章)</span>
          </div>
          {expanded[vKey(vol)] && (
            <div className="p-4">
              {vol.chapters.length === 0
                ? <div className="text-gray-400 py-4 text-center">暂无章节</div>
                : <div className="space-y-2">
                    {[...vol.chapters].sort((a, b) => a.chapterNum - b.chapterNum).map((ch) => (
                      <div key={ch.chapterNum} className="border rounded dark:border-zinc-800 overflow-hidden">
                        {/* 章节行：可点击展开 */}
                        <div 
                          onClick={() => toggleChapter(ch.chapterNum)}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-zinc-950 cursor-pointer"
                        >
                          <span className="text-gray-400 text-sm w-5 shrink-0">
                            {expandedChapter === ch.chapterNum ? "▼" : "▶"}
                          </span>
                          <span className="text-gray-500 w-14 shrink-0 text-sm">第{ch.chapterNum}章</span>
                          <span className="flex-1 text-zinc-900 dark:text-zinc-100">{ch.title}</span>
                          <span className="text-sm text-gray-500 truncate hidden sm:inline">
                            {(ch.plotSummary || ch.summary || "").slice(0, 40)}
                          </span>
                        </div>
                        {/* 展开的章节内容 */}
                        {expandedChapter === ch.chapterNum && (
                          <div className="border-t dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-3">
                            <div className="bg-white dark:bg-zinc-950 p-3 rounded border-l-4 border-l-purple-500 dark:border-l-purple-600 space-y-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                    第{ch.chapterNum}章细纲展开
                                  </div>
                                  {ch.dayMarker && (
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                      {ch.dayMarker}
                                    </div>
                                  )}
                                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-pre-wrap break-words">
                                    {ch.plotSummary || ch.summary || "暂无章节摘要"}
                                  </div>
                                </div>
                                {editingChapter === ch.chapterNum ? (
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSaveChapter(ch.chapterNum);
                                      }}
                                      disabled={savingChapter}
                                      className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                      {savingChapter ? "保存中..." : "保存"}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelEditingChapter();
                                      }}
                                      disabled={savingChapter}
                                      className="text-xs px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-900 disabled:opacity-50"
                                    >
                                      取消
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditingChapter(ch);
                                    }}
                                    className="text-xs px-3 py-1.5 rounded border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 shrink-0"
                                  >
                                    编辑
                                  </button>
                                )}
                              </div>

                              {editingChapter === ch.chapterNum ? (
                                <div className="space-y-3">
                                  <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                                    第{ch.chapterNum}章：{ch.title}
                                  </div>
                                  <textarea
                                    rows={20}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className={`${inputCls} min-h-[28rem] resize-y font-mono leading-7`}
                                  />
                                </div>
                              ) : parseChapterToSections(ch).length > 0 ? (
                                <div className="space-y-3">
                                  {parseChapterToSections(ch).map((section) => (
                                    <div key={section.key} className="grid gap-2 md:grid-cols-[110px_minmax(0,1fr)] md:items-start">
                                      <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        【{section.label}】
                                      </div>
                                      <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                                        {section.value}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : chapterContents[ch.chapterNum] ? (
                                <pre className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300 max-h-64 overflow-y-auto">
                                  {chapterContents[ch.chapterNum]}
                                </pre>
                              ) : (
                                <div className="text-sm text-gray-400">暂无详细内容</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>}
            </div>
          )}
        </div>
      );
      })}

      {/* ===== 批量导入 Modal ===== */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setImportModalOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold dark:text-zinc-100">批量导入章节</h3>
              <button onClick={() => setImportModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <select value={selectedVolumeForImport}
              onChange={(e) => setSelectedVolumeForImport(Number(e.target.value) || "")}
              className="w-full mb-4 px-3 py-2 border rounded dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100">
              <option value="">选择目标卷</option>
              {sortedVolumes.map((v) => (
                <option key={vKey(v)} value={v.volumeNum}>
                  {v.volumeNum ? `第${v.volumeNum}卷：${v.title}` : v.title}
                </option>
              ))}
            </select>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
              placeholder="每行一个章节标题..."
              className="w-full h-40 p-3 border rounded resize-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setImportModalOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-100">取消</button>
              <button onClick={handleBatchImport}
                disabled={!selectedVolumeForImport || !importText.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">导入</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== AI 生成 Modal ===== */}
      {outlineModalOpen && (
        <div className="fixed inset-0 z-40" onClick={() => !generating && setOutlineModalOpen(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div className="fixed left-1/2 top-1/2 z-50 w-[min(900px,calc(100vw-2rem))] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-bold dark:text-zinc-100">AI生成新卷细纲</div>
              <button onClick={() => !generating && setOutlineModalOpen(false)}
                className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">✕</button>
            </div>

            {mode === "form" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {OUTLINE_FORM_FIELDS.map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">{label}</label>
                      <input type={type} value={form[key]}
                        onChange={(e) => setForm((p) => ({ ...p, [key]: type === "number" ? Number(e.target.value) : e.target.value }))}
                        className={inputCls} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">本卷概要</label>
                  <textarea rows={10} value={form.volumeSummary}
                    onChange={(e) => setForm((p) => ({ ...p, volumeSummary: e.target.value }))}
                    placeholder="详细描述本卷的核心冲突、关键情节线、情绪弧线、爽点设计..."
                    className={inputCls} />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-zinc-700 dark:text-zinc-300">主要角色</label>
                  <div className="flex flex-wrap gap-2">
                    {roleOptions.length === 0 && <div className="text-sm text-zinc-500">（未加载到角色列表）</div>}
                    {roleOptions.map((name) => {
                      const checked = selectedRoles.includes(name);
                      return (
                        <label key={name} className={`cursor-pointer select-none rounded-full border px-3 py-1 text-sm transition-colors ${
                          checked ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
                            : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"}`}>
                          <input type="checkbox" className="hidden" checked={checked}
                            onChange={() => setSelectedRoles((p) => checked ? p.filter((x) => x !== name) : [...p, name])} />
                          {name}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">特殊约束</label>
                  <textarea rows={5} value={form.constraints}
                    onChange={(e) => setForm((p) => ({ ...p, constraints: e.target.value }))}
                    placeholder="选填：必须包含或必须避免的情节要求..."
                    className={inputCls} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setOutlineModalOpen(false)}
                    className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">取消</button>
                  <button onClick={handleGenerate} disabled={generating}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                    {generating ? "AI正在生成细纲，预计1-2分钟..." : "生成细纲"}
                  </button>
                </div>
              </div>
            )}

            {mode === "preview" && (
              <div>
                <div className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
                  AI已生成 {generated.length} 章细纲，请审核后确认保存
                </div>
                <div className="space-y-3">
                  {generated.map((ch) => {
                    const isCol = collapsed[ch.chapterNum] ?? false;
                    return (
                      <div key={ch.chapterNum}
                        className="rounded-lg border-l-4 border-l-blue-500 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium dark:text-zinc-100">第{ch.chapterNum}章：{ch.title}</div>
                          <button onClick={() => setCollapsed((p) => ({ ...p, [ch.chapterNum]: !isCol }))}
                            className="shrink-0 rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
                            {isCol ? "展开" : "折叠"}
                          </button>
                        </div>
                        {!isCol && (
                          <div className="mt-3 grid gap-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="mb-1 block text-xs text-zinc-500">章节号</label>
                                <input type="number" value={ch.chapterNum}
                                  onChange={(e) => { const n = +e.target.value; setGenerated((prev) => prev.map((x) => x.chapterNum === ch.chapterNum ? { ...x, chapterNum: n } : x)); }}
                                  className={inputCls} />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-zinc-500">标题</label>
                                <input value={ch.title} onChange={(e) => updCh(ch.chapterNum, { title: e.target.value })} className={inputCls} />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-zinc-500">核心功能（corePurpose）</label>
                              <textarea rows={2} value={ch.corePurpose} onChange={(e) => updCh(ch.chapterNum, { corePurpose: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-zinc-500">情节点（每行一个）</label>
                              <textarea rows={4} value={(ch.plotPoints || []).join("\n")}
                                onChange={(e) => updCh(ch.chapterNum, { plotPoints: e.target.value.split("\n").filter(Boolean) })} className={inputCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="mb-1 block text-xs text-zinc-500">关键角色（逗号分隔）</label>
                                <input value={(ch.keyCharacters || []).join(",")}
                                  onChange={(e) => updCh(ch.chapterNum, { keyCharacters: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                                  className={inputCls} />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-zinc-500">字数建议</label>
                                <input value={ch.wordCountGuide} onChange={(e) => updCh(ch.chapterNum, { wordCountGuide: e.target.value })} className={inputCls} />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-zinc-500">情绪弧线</label>
                              <input value={ch.emotionalArc} onChange={(e) => updCh(ch.chapterNum, { emotionalArc: e.target.value })} className={inputCls} />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-zinc-500">章末钩子</label>
                              <textarea rows={2} value={ch.endHook} onChange={(e) => updCh(ch.chapterNum, { endHook: e.target.value })} className={inputCls} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="mb-1 block text-xs text-zinc-500">与上一章衔接</label>
                                <textarea rows={2} value={ch.connectionToPrev} onChange={(e) => updCh(ch.chapterNum, { connectionToPrev: e.target.value })} className={inputCls} />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-zinc-500">为下一章埋线</label>
                                <textarea rows={2} value={ch.connectionToNext} onChange={(e) => updCh(ch.chapterNum, { connectionToNext: e.target.value })} className={inputCls} />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-zinc-500">必须包含（每行一个）</label>
                              <textarea rows={3} value={(ch.mustInclude || []).join("\n")}
                                onChange={(e) => updCh(ch.chapterNum, { mustInclude: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} className={inputCls} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setMode("form")}
                    className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">重新生成</button>
                  <button onClick={handleSaveGenerated}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">确认并保存到大纲</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
