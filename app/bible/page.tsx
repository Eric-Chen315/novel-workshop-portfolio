"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type {
  CharacterRow,
  DeprecatedRow,
  PlotlineRow,
  SettingRow,
} from "@/lib/bible/types";

type TabKey = "characters" | "settings" | "plotlines" | "deprecated";

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiSend<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function useBibleData() {
  const [characters, setCharacters] = useState<CharacterRow[]>([]);
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [plotlines, setPlotlines] = useState<PlotlineRow[]>([]);
  const [deprecated, setDeprecated] = useState<DeprecatedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const [c, s, p, d] = await Promise.all([
        apiGet<{ data: CharacterRow[] }>("/api/bible/characters"),
        apiGet<{ data: SettingRow[] }>("/api/bible/settings"),
        apiGet<{ data: PlotlineRow[] }>("/api/bible/plotlines"),
        apiGet<{ data: DeprecatedRow[] }>("/api/bible/deprecated"),
      ]);
      setCharacters(c.data);
      setSettings(s.data);
      setPlotlines(p.data);
      setDeprecated(d.data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  return {
    characters,
    settings,
    plotlines,
    deprecated,
    loading,
    error,
    reload,
    setCharacters,
    setSettings,
    setPlotlines,
    setDeprecated,
  };
}

function SectionCard(props: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold">{props.title}</h2>
        {props.desc ? <p className="mt-1 text-xs text-zinc-500">{props.desc}</p> : null}
      </div>
      {props.children}
    </section>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-600">{props.label}</label>
      {props.textarea ? (
        <textarea
          className="min-h-20 w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20"
          placeholder={props.placeholder}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      ) : (
        <input
          className="h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/20"
          placeholder={props.placeholder}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function CharactersPanel(props: {
  rows: CharacterRow[];
  onReload: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<Partial<CharacterRow> | null>(null);

  const sorted = useMemo(() => props.rows, [props.rows]);

  async function save() {
    if (!editing) return;
    if (!editing.name || editing.name.trim().length === 0) {
      alert("角色名必填");
      return;
    }

    const payload = {
      id: editing.id,
      name: editing.name,
      ageAppearance: editing.ageAppearance || "",
      background: editing.background || "",
      personality: editing.personality || "",
      speakingStyle: editing.speakingStyle || "",
      catchphrase: editing.catchphrase || "",
      currentLocation: editing.currentLocation || "",
      currentStatus: editing.currentStatus || "",
      defaultInject: (editing.defaultInject ?? 0) as 0 | 1,
    };
    await apiSend("/api/bible/characters", "POST", payload);
    setEditing(null);
    await props.onReload();
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard
        title="角色卡片"
        desc="勾选“默认注入”的角色会自动拼入写手/审核 Agent 的 System Prompt（李弈强制默认注入且不可取消）。"
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            className="rounded-lg bg-black px-3 py-2 text-sm text-white"
            onClick={() =>
              setEditing({
                id: undefined,
                name: "",
                ageAppearance: "",
                background: "",
                personality: "",
                speakingStyle: "",
                catchphrase: "",
                currentLocation: "",
                currentStatus: "",
                defaultInject: 0,
              })
            }
            type="button"
          >
            新增角色
          </button>
          <div className="text-xs text-zinc-500">共 {sorted.length} 个</div>
        </div>

        <div className="grid gap-3">
          {sorted.map((c) => (
            <div key={c.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {c.personality ? `性格：${c.personality}` : "（未填写性格特征）"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-700">
                    <input
                      type="checkbox"
                      checked={c.defaultInject === 1}
                      disabled={c.locked === 1}
                      onChange={async (e) => {
                        await apiSend("/api/bible/characters", "PATCH", {
                          id: c.id,
                          defaultInject: e.target.checked ? 1 : 0,
                        });
                        await props.onReload();
                      }}
                    />
                    默认注入
                  </label>
                  <button
                    className="rounded-lg border px-2 py-1 text-xs"
                    onClick={() => setEditing(c)}
                    type="button"
                  >
                    编辑
                  </button>
                  <button
                    className="rounded-lg border px-2 py-1 text-xs text-red-600 disabled:opacity-50"
                    disabled={c.locked === 1}
                    onClick={async () => {
                      if (!confirm(`确认删除角色：${c.name} ?`)) return;
                      await fetch(`/api/bible/characters?id=${encodeURIComponent(c.id)}`, {
                        method: "DELETE",
                      });
                      await props.onReload();
                    }}
                    type="button"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className="mt-2 grid gap-2 text-xs text-zinc-600">
                {c.speakingStyle ? <div>说话风格：{c.speakingStyle}</div> : null}
                {c.catchphrase ? <div>口头禅：{c.catchphrase}</div> : null}
                {c.currentLocation ? <div>当前位置：{c.currentLocation}</div> : null}
                {c.currentStatus ? <div>当前状态：{c.currentStatus}</div> : null}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={editing?.id ? "编辑角色" : "新增角色"} desc="保存后会立即写入 SQLite。">
        {editing ? (
          <div className="grid gap-3">
            <Field label="角色名*" value={editing.name || ""} onChange={(v) => setEditing((p) => ({ ...p!, name: v }))} />
            <Field label="年龄/外貌" value={editing.ageAppearance || ""} onChange={(v) => setEditing((p) => ({ ...p!, ageAppearance: v }))} />
            <Field label="背景" value={editing.background || ""} onChange={(v) => setEditing((p) => ({ ...p!, background: v }))} textarea />
            <Field label="性格特征" value={editing.personality || ""} onChange={(v) => setEditing((p) => ({ ...p!, personality: v }))} textarea />
            <Field label="说话风格" value={editing.speakingStyle || ""} onChange={(v) => setEditing((p) => ({ ...p!, speakingStyle: v }))} textarea />
            <Field label="口头禅" value={editing.catchphrase || ""} onChange={(v) => setEditing((p) => ({ ...p!, catchphrase: v }))} />
            <Field label="当前位置（截至最新章节）" value={editing.currentLocation || ""} onChange={(v) => setEditing((p) => ({ ...p!, currentLocation: v }))} />
            <Field label="当前状态" value={editing.currentStatus || ""} onChange={(v) => setEditing((p) => ({ ...p!, currentStatus: v }))} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(editing.defaultInject ?? 0) === 1}
                disabled={editing.locked === 1 || editing.id === "li_yi"}
                onChange={(e) => setEditing((p) => ({ ...p!, defaultInject: e.target.checked ? 1 : 0 }))}
              />
              默认注入
              {editing.id === "li_yi" ? (
                <span className="text-xs text-zinc-500">（李弈强制开启）</span>
              ) : null}
            </label>

            <div className="mt-2 flex gap-2">
              <button className="rounded-lg bg-black px-3 py-2 text-sm text-white" onClick={save} type="button">
                保存
              </button>
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setEditing(null)} type="button">
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">点击左侧“新增角色”开始编辑。</div>
        )}
      </SectionCard>
    </div>
  );
}

function SimpleListPanel<T extends { id: string; name: string }>(props: {
  title: string;
  desc?: string;
  rows: T[];
  newItem: () => T;
  renderEditor: (draft: T, setDraft: (next: T) => void) => React.ReactNode;
  onSave: (draft: T) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<T | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard title={props.title} desc={props.desc}>
        <div className="mb-3 flex items-center justify-between">
          <button
            className="rounded-lg bg-black px-3 py-2 text-sm text-white"
            onClick={() => setDraft(props.newItem())}
            type="button"
          >
            新增
          </button>
          <div className="text-xs text-zinc-500">共 {props.rows.length} 条</div>
        </div>
        <div className="grid gap-3">
          {props.rows.map((r) => (
            <div key={r.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="flex gap-2">
                  <button className="rounded-lg border px-2 py-1 text-xs" onClick={() => setDraft(r)} type="button">
                    编辑
                  </button>
                  <button
                    className="rounded-lg border px-2 py-1 text-xs text-red-600"
                    onClick={async () => {
                      if (!confirm("确认删除？")) return;
                      await props.onDelete(r.id);
                    }}
                    type="button"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={draft?.id ? "编辑" : "新增"}>
        {draft ? (
          <div className="grid gap-3">
            {props.renderEditor(draft, setDraft)}
            <div className="mt-2 flex gap-2">
              <button
                className="rounded-lg bg-black px-3 py-2 text-sm text-white"
                onClick={async () => {
                  await props.onSave(draft);
                  setDraft(null);
                }}
                type="button"
              >
                保存
              </button>
              <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setDraft(null)} type="button">
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">点击左侧“新增/编辑”。</div>
        )}
      </SectionCard>
    </div>
  );
}

export default function BiblePage() {
  const data = useBibleData();
  const [tab, setTab] = useState<TabKey>("characters");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="text-sm font-semibold">小说一站式生成工作台 · MVP</div>
            <nav className="flex items-center gap-3 text-sm">
              <Link className="text-zinc-700 hover:underline" href="/">
                创作工作台
              </Link>
              <Link className="font-semibold text-zinc-900 hover:underline" href="/bible">
                角色圣经
              </Link>
            </nav>
          </div>
          <div className="text-xs text-zinc-500">SQLite 本地存储</div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              { key: "characters", title: "角色卡片" },
              { key: "settings", title: "道具与设定" },
              { key: "plotlines", title: "暗线约束" },
              { key: "deprecated", title: "废弃设定" },
            ] as Array<{ key: TabKey; title: string }>
          ).map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  isActive
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
                onClick={() => setTab(t.key)}
                type="button"
              >
                {t.title}
              </button>
            );
          })}
          <button
            className="ml-auto rounded-lg border px-3 py-2 text-xs"
            onClick={() => void data.reload()}
            disabled={data.loading}
            type="button"
          >
            {data.loading ? "加载中…" : "刷新"}
          </button>
        </div>

        {data.error ? <div className="mb-4 rounded-lg border bg-white p-3 text-sm text-red-600">{data.error}</div> : null}

        {tab === "characters" ? (
          <CharactersPanel rows={data.characters} onReload={data.reload} />
        ) : null}

        {tab === "settings" ? (
          <SimpleListPanel<SettingRow>
            title="道具与设定"
            desc="每条包含：名称、描述、当前状态。"
            rows={data.settings}
            newItem={() => ({
              id: "",
              name: "",
              description: "",
              status: "",
              createdAt: "",
              updatedAt: "",
            })}
            renderEditor={(draft, setDraft) => (
              <>
                <Field label="名称*" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
                <Field label="描述" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} textarea />
                <Field label="当前状态" value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} />
              </>
            )}
            onSave={async (draft) => {
              await apiSend("/api/bible/settings", "POST", {
                id: draft.id || undefined,
                name: draft.name,
                description: draft.description,
                status: draft.status,
              });
              await data.reload();
            }}
            onDelete={async (id) => {
              await fetch(`/api/bible/settings?id=${encodeURIComponent(id)}`, { method: "DELETE" });
              await data.reload();
            }}
          />
        ) : null}

        {tab === "plotlines" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SectionCard title="暗线约束" desc="每条包含：暗线名称、约束规则、引爆条件、当前状态（未引爆/已引爆）。">
              <div className="grid gap-3">
                {data.plotlines.map((p) => (
                  <div key={p.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="mt-1 text-xs text-zinc-600">{p.rule || "（未填写约束规则）"}</div>
                        <div className="mt-1 text-xs text-zinc-500">引爆条件：{p.trigger || "（未填写）"}</div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          className={`rounded-full border px-3 py-1 text-xs ${
                            p.status === "triggered"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                          onClick={async () => {
                            await apiSend("/api/bible/plotlines", "PATCH", {
                              id: p.id,
                              status: p.status === "triggered" ? "untriggered" : "triggered",
                            });
                            await data.reload();
                          }}
                          type="button"
                        >
                          {p.status === "triggered" ? "已引爆" : "未引爆"}
                        </button>
                        <div className="flex gap-2">
                          <button
                            className="rounded-lg border px-2 py-1 text-xs"
                            onClick={() => {
                              // 复用 SimpleList 的编辑体验：用 prompt 简化
                              const name = prompt("暗线名称", p.name) ?? p.name;
                              const rule = prompt("约束规则", p.rule) ?? p.rule;
                              const trigger = prompt("引爆条件", p.trigger) ?? p.trigger;
                              void (async () => {
                                await apiSend("/api/bible/plotlines", "POST", {
                                  id: p.id,
                                  name,
                                  rule,
                                  trigger,
                                  status: p.status,
                                });
                                await data.reload();
                              })();
                            }}
                            type="button"
                          >
                            编辑
                          </button>
                          <button
                            className="rounded-lg border px-2 py-1 text-xs text-red-600"
                            onClick={async () => {
                              if (!confirm("确认删除？")) return;
                              await fetch(`/api/bible/plotlines?id=${encodeURIComponent(p.id)}`, { method: "DELETE" });
                              await data.reload();
                            }}
                            type="button"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="mt-3 rounded-lg bg-black px-3 py-2 text-sm text-white"
                onClick={async () => {
                  const name = prompt("暗线名称")?.trim();
                  if (!name) return;
                  const rule = prompt("约束规则")?.trim() || "";
                  const trigger = prompt("引爆条件")?.trim() || "";
                  await apiSend("/api/bible/plotlines", "POST", {
                    name,
                    rule,
                    trigger,
                    status: "untriggered",
                  });
                  await data.reload();
                }}
                type="button"
              >
                新增暗线
              </button>
            </SectionCard>

            <SectionCard title="说明" desc="暗线区块我这里做成了列表 + 状态一键切换；编辑/新增先用 prompt 简化（后续可按角色卡片的右侧表单方式再增强）。">
              <div className="text-sm text-zinc-600 leading-6">
                <div>• 未引爆的暗线会被自动注入到 Prompt 的【暗线约束】。</div>
                <div>• 已引爆的暗线仍保留在库中，但不再注入。</div>
              </div>
            </SectionCard>
          </div>
        ) : null}

        {tab === "deprecated" ? (
          <SimpleListPanel<DeprecatedRow>
            title="废弃设定"
            desc="每条包含：设定名称、原始内容、废弃原因。"
            rows={data.deprecated}
            newItem={() => ({
              id: "",
              name: "",
              content: "",
              reason: "",
              createdAt: "",
              updatedAt: "",
            })}
            renderEditor={(draft, setDraft) => (
              <>
                <Field label="设定名称*" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
                <Field label="原始内容" value={draft.content} onChange={(v) => setDraft({ ...draft, content: v })} textarea />
                <Field label="废弃原因" value={draft.reason} onChange={(v) => setDraft({ ...draft, reason: v })} textarea />
              </>
            )}
            onSave={async (draft) => {
              await apiSend("/api/bible/deprecated", "POST", {
                id: draft.id || undefined,
                name: draft.name,
                content: draft.content,
                reason: draft.reason,
              });
              await data.reload();
            }}
            onDelete={async (id) => {
              await fetch(`/api/bible/deprecated?id=${encodeURIComponent(id)}`, { method: "DELETE" });
              await data.reload();
            }}
          />
        ) : null}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-zinc-400">
        第3步：角色圣经管理页面（/bible） + SQLite + 动态注入。
      </footer>
    </div>
  );
}
