"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { use } from "react";

const GENRES = ["玄幻", "都市", "科幻", "言情", "悬疑", "历史", "游戏", "末世", "其他"] as const;
const TARGET_WORDS = ["30万字", "50万字", "100万字", "200万字", "自定义"] as const;

type Genre = (typeof GENRES)[number];
type TargetWords = (typeof TARGET_WORDS)[number];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-gray-900">{children}</div>;
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const projectId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState<Genre>("玄幻");
  const [targetWords, setTargetWords] = useState<TargetWords>("100万字");
  const [targetWordsCustom, setTargetWordsCustom] = useState<number>(100);
  const [synopsis, setSynopsis] = useState("");
  const [styleDescription, setStyleDescription] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [status, setStatus] = useState<"active" | "archived">("active");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
        if (!res.ok) {
          alert("项目不存在");
          router.push("/projects");
          return;
        }
        const j = (await res.json()) as {
          data: {
            title: string;
            genre: Genre;
            targetWords: TargetWords;
            targetWordsCustom?: number;
            synopsis: string;
            styleDescription: string;
            tags: string[];
            status: "active" | "archived";
          };
        };
        if (cancelled) return;

        setTitle(j.data.title || "");
        setGenre(j.data.genre || "玄幻");
        setTargetWords(j.data.targetWords || "100万字");
        setTargetWordsCustom(Math.max(1, Math.round((j.data.targetWordsCustom || 1000000) / 10000)));
        setSynopsis(j.data.synopsis || "");
        setStyleDescription(j.data.styleDescription || "");
        setTagsText((j.data.tags || []).join(","));
        setStatus(j.data.status || "active");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [projectId, router]);

  const missing = useMemo(() => {
    const arr: string[] = [];
    if (!title.trim()) arr.push("作品标题");
    if (!synopsis.trim()) arr.push("作品简介");
    if (!styleDescription.trim()) arr.push("文风说明");
    return arr;
  }, [title, synopsis, styleDescription]);

  const canEnter = missing.length === 0 && !saving;

  async function save(enterAfter: boolean) {
    setSaving(true);
    try {
      const tags = tagsText
        .split(/[,，\n]/g)
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: projectId,
          title,
          genre,
          targetWords,
          targetWordsCustom: targetWords === "自定义" ? targetWordsCustom * 10000 : undefined,
          synopsis,
          styleDescription,
          tags,
          status,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`保存失败：${j?.error || res.status}`);
        return;
      }

      if (enterAfter) router.push(`/projects/${projectId}/workspace`);
      else router.push("/projects");
    } finally {
      setSaving(false);
    }
  }

  async function doArchiveToggle(next: "active" | "archived") {
    const ok = confirm(next === "archived" ? "确认归档该项目？" : "确认取消归档？");
    if (!ok) return;
    const res = await fetch(`/api/projects?id=${encodeURIComponent(projectId)}&action=${next === "archived" ? "archive" : "unarchive"}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      alert("操作失败");
      return;
    }
    setStatus(next);
  }

  async function doDelete() {
    const ok = confirm("确认彻底删除该项目？（将删除本地 data/projects 下所有文件）");
    if (!ok) return;
    const res = await fetch(`/api/projects?id=${encodeURIComponent(projectId)}`, { method: "DELETE" });
    if (!res.ok) {
      alert("删除失败");
      return;
    }
    router.push("/projects");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-6 py-10">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">编辑作品</h1>
            <p className="mt-1 text-sm text-gray-600">修改后将影响知识库注入与写作效果。</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => doArchiveToggle(status === "active" ? "archived" : "active")}
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              {status === "active" ? "归档" : "取消归档"}
            </button>
            <button
              onClick={doDelete}
              className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              删除
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-lg border bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <FieldLabel>作品标题（必填）</FieldLabel>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <FieldLabel>作品类型</FieldLabel>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value as Genre)}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                >
                  {GENRES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>目标字数</FieldLabel>
                <select
                  value={targetWords}
                  onChange={(e) => setTargetWords(e.target.value as TargetWords)}
                  className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
                >
                  {TARGET_WORDS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
                {targetWords === "自定义" ? (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <input
                      type="number"
                      min={1}
                      value={targetWordsCustom}
                      onChange={(e) => setTargetWordsCustom(Number(e.target.value || 0))}
                      className="w-28 rounded-md border px-3 py-2"
                    />
                    <span className="text-gray-600">万字</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <FieldLabel>作品简介（必填，300字以内）</FieldLabel>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="mt-2 h-28 w-full rounded-md border px-3 py-2 text-sm"
                maxLength={300}
                placeholder="请描述核心冲突和主线剧情"
              />
              <div className="mt-1 text-right text-xs text-gray-500">{synopsis.length}/300</div>
            </div>

            <div>
              <FieldLabel>文风说明（必填）</FieldLabel>
              <textarea
                value={styleDescription}
                onChange={(e) => setStyleDescription(e.target.value)}
                className="mt-2 h-28 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <FieldLabel>标签（多选，逗号/换行分隔，支持自定义）</FieldLabel>
              <textarea
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="mt-2 h-20 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            {missing.length > 0 ? (
              <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                先补充这些设定，AI 才能更贴合你的故事：{missing.join("、")}
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <button
              disabled={saving}
              onClick={() => save(false)}
              className="rounded-md border px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50"
            >
              保存
            </button>
            <button
              disabled={!canEnter}
              onClick={() => save(true)}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              title={missing.length > 0 ? "先补充这些设定，AI才能更贴合你的故事" : ""}
            >
              保存并进入工作台
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}