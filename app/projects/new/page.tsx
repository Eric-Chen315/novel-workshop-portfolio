"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const GENRES = ["玄幻", "都市", "科幻", "言情", "悬疑", "历史", "游戏", "末世", "其他"] as const;
const TARGET_WORDS = ["30万字", "50万字", "100万字", "200万字", "自定义"] as const;

type Genre = (typeof GENRES)[number];
type TargetWords = (typeof TARGET_WORDS)[number];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-gray-900">{children}</div>;
}

export default function NewProjectPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState<Genre>("玄幻");
  const [targetWords, setTargetWords] = useState<TargetWords>("100万字");
  const [targetWordsCustom, setTargetWordsCustom] = useState<number>(100);
  const [synopsis, setSynopsis] = useState("");
  const [styleDescription, setStyleDescription] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [saving, setSaving] = useState(false);

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
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          genre,
          targetWords,
          targetWordsCustom: targetWords === "自定义" ? targetWordsCustom * 10000 : undefined,
          synopsis,
          styleDescription,
          tags,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        alert(`保存失败：${j?.error || res.status}`);
        return;
      }
      const j = (await res.json()) as { data: { id: string } };
      if (enterAfter) {
        router.push(`/projects/${j.data.id}/workspace`);
      } else {
        router.push("/projects");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">新建作品</h1>
            <p className="mt-1 text-sm text-gray-600">先补充设定，AI 才能更贴合你的故事。</p>
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
                placeholder="例如：深渊回响"
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
                placeholder="例如：轻松幽默、毒舌吐槽风，类似《诡秘之主》的克苏鲁悬疑风..."
              />
            </div>

            <div>
              <FieldLabel>标签（多选，逗号/换行分隔，支持自定义）</FieldLabel>
              <textarea
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="mt-2 h-20 w-full rounded-md border px-3 py-2 text-sm"
                placeholder="例如：克苏鲁, 双男主, 爽文"
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
