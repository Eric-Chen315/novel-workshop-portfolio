'use client';

import { useState } from 'react';
import type {
  TechLineFact,
  FactionFact,
  MajorEvent,
  RevealedInfo,
  ConceptFact,
  KeyDataFact,
  TimelineEntry,
} from '@/lib/factsManager';

// ============================================================================
// Tech Lines Section
// ============================================================================

interface TechLinesSectionProps {
  techLines: Record<string, TechLineFact>;
  onChange: (
    techLines: Record<string, TechLineFact>,
    options?: { persistImmediately?: boolean; successMessage?: string }
  ) => void;
}

export function TechLinesSection({ techLines, onChange }: TechLinesSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState<{ key: string; data: TechLineFact } | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const entries = Object.entries(techLines);

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">技术线</h3>
        <span className="text-gray-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="p-4 space-y-3">
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
          >
            + 添加技术线
          </button>

          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">暂无技术线数据</p>
          ) : (
            <div className="space-y-2">
              {entries.map(([key, tech]) => (
                <div
                  key={key}
                  className="border border-gray-200 dark:border-zinc-800 rounded-md p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{key}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        当前版本: {tech.currentVersion} | 截至: 卷{tech.asOfVolume} 第{tech.asOfChapter}章
                      </div>
                      {tech.rule && (
                        <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">规则: {tech.rule}</div>
                      )}
                      {tech.progression.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tech.progression.map((p, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded"
                            >
                              {i + 1}. {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setEditing({ key, data: tech })}
                      className="ml-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs"
                    >
                      编辑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {editing && (
            <TechLineModal
              techKey={editing.key}
              techLine={editing.data}
              onSave={(key, data) => {
                const newTech = { ...techLines };
                if (key !== editing.key) delete newTech[editing.key];
                newTech[key] = data;
                onChange(newTech, { persistImmediately: true, successMessage: '技术线修改已保存到文件' });
                setEditing(null);
              }}
              onDelete={() => {
                const newTech = { ...techLines };
                delete newTech[editing.key];
                onChange(newTech, { persistImmediately: true, successMessage: '技术线删除已保存到文件' });
                setEditing(null);
              }}
              onClose={() => setEditing(null)}
            />
          )}

          {showAdd && (
            <TechLineModal
              techKey=""
              techLine={{
                currentVersion: '',
                asOfVolume: 1,
                asOfChapter: 1,
                progression: [],
                rule: '',
              }}
              onSave={(key, data) => {
                onChange({ ...techLines, [key]: data }, { persistImmediately: true, successMessage: '技术线新增已保存到文件' });
                setShowAdd(false);
              }}
              onClose={() => setShowAdd(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Major Events, Revealed Info, Plot Rules, Pattern Keywords Sections
// ============================================================================

export function MajorEventsSection({
  events,
  onChange,
}: {
  events: MajorEvent[];
  onChange: (
    e: MajorEvent[],
    options?: { persistImmediately?: boolean; successMessage?: string }
  ) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState<MajorEvent | null>(null);
  const editingAffectedCharacters = editing?.affectedCharacters || [];
  
  const grouped = events.reduce((acc, e) => {
    if (!acc[e.volume]) acc[e.volume] = [];
    acc[e.volume].push(e);
    return acc;
  }, {} as Record<number, MajorEvent[]>);

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">不可逆事件</h3>
        <span className="text-gray-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>
      {!collapsed && (
        <div className="p-4 space-y-3">
          <button onClick={() => setEditing({ id: Date.now().toString(), event: '', volume: 1, chapter: 1, irreversible: true, affectedCharacters: [] })} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md">+ 添加事件</button>
          {events.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">暂无事件数据</p> : (
            <div className="space-y-4">
              {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([vol, evts]) => (
                <div key={vol}>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">第{vol}卷</h4>
                  <div className="space-y-2">
                    {evts.map(e => (
                      <div key={e.id} className="border border-gray-200 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-zinc-900">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm text-gray-900 dark:text-gray-100">{e.event}</div>
                            <div className="text-xs text-gray-500 mt-1">第{e.chapter}章 {e.irreversible && <span className="text-red-600">• 不可逆</span>}</div>
                            {(e.affectedCharacters || []).length > 0 && <div className="text-xs text-gray-500 mt-1">影响: {(e.affectedCharacters || []).join(', ')}</div>}
                          </div>
                          <button onClick={() => setEditing(e)} className="ml-2 text-blue-600 hover:text-blue-700 text-xs">编辑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {editing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full p-6 space-y-4">
                <h3 className="text-lg font-semibold">编辑事件</h3>
                <input placeholder="事件描述" value={editing.event} onChange={e => setEditing({...editing, event: e.target.value})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="卷" value={editing.volume} onChange={e => setEditing({...editing, volume: +e.target.value})} className="px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
                  <input type="number" placeholder="章" value={editing.chapter} onChange={e => setEditing({...editing, chapter: +e.target.value})} className="px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
                </div>
                <label className="flex items-center"><input type="checkbox" checked={editing.irreversible} onChange={e => setEditing({...editing, irreversible: e.target.checked})} className="mr-2" />不可逆</label>
                <input placeholder="影响角色（逗号分隔）" value={editingAffectedCharacters.join(',')} onChange={e => setEditing({...editing, affectedCharacters: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
                <div className="flex justify-between">
                  <button onClick={() => { onChange(events.filter(ev => ev.id !== editing.id), { persistImmediately: true, successMessage: '不可逆事件删除已保存到文件' }); setEditing(null); }} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm">删除</button>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-md text-sm">取消</button>
                    <button onClick={() => { const idx = events.findIndex(e => e.id === editing.id); if (idx >= 0) { const n = [...events]; n[idx] = editing; onChange(n, { persistImmediately: true, successMessage: '不可逆事件修改已保存到文件' }); } else { onChange([...events, editing], { persistImmediately: true, successMessage: '不可逆事件新增已保存到文件' }); } setEditing(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">保存并落盘</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RevealedInfoSection({
  info,
  onChange,
}: {
  info: RevealedInfo[];
  onChange: (
    i: RevealedInfo[],
    options?: { persistImmediately?: boolean; successMessage?: string }
  ) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState<RevealedInfo | null>(null);
  
  const grouped = info.reduce((acc, i) => {
    if (!acc[i.volume]) acc[i.volume] = [];
    acc[i.volume].push(i);
    return acc;
  }, {} as Record<number, RevealedInfo[]>);

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">已揭示信息</h3>
        <span className="text-gray-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>
      {!collapsed && (
        <div className="p-4 space-y-3">
          <button onClick={() => setEditing({ id: Date.now().toString(), info: '', volume: 1, chapter: 1, note: '' })} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md">+ 添加信息</button>
          {info.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">暂无揭示信息</p> : (
            <div className="space-y-4">
              {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([vol, infos]) => (
                <div key={vol}>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">第{vol}卷</h4>
                  <div className="space-y-2">
                    {infos.map(i => (
                      <div key={i.id} className="border border-gray-200 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-zinc-900">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-sm text-gray-900 dark:text-gray-100">{i.info}</div>
                            <div className="text-xs text-gray-500 mt-1">第{i.chapter}章 {i.note && `• ${i.note}`}</div>
                          </div>
                          <button onClick={() => setEditing(i)} className="ml-2 text-blue-600 hover:text-blue-700 text-xs">编辑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {editing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full p-6 space-y-4">
                <h3 className="text-lg font-semibold">编辑揭示信息</h3>
                <textarea placeholder="信息内容" value={editing.info} onChange={e => setEditing({...editing, info: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="卷" value={editing.volume} onChange={e => setEditing({...editing, volume: +e.target.value})} className="px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
                  <input type="number" placeholder="章" value={editing.chapter} onChange={e => setEditing({...editing, chapter: +e.target.value})} className="px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
                </div>
                <input placeholder="备注" value={editing.note} onChange={e => setEditing({...editing, note: e.target.value})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
                <div className="flex justify-between">
                  <button onClick={() => { onChange(info.filter(i => i.id !== editing.id), { persistImmediately: true, successMessage: '已揭示信息删除已保存到文件' }); setEditing(null); }} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm">删除</button>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-md text-sm">取消</button>
                    <button onClick={() => { const idx = info.findIndex(i => i.id === editing.id); if (idx >= 0) { const n = [...info]; n[idx] = editing; onChange(n, { persistImmediately: true, successMessage: '已揭示信息修改已保存到文件' }); } else { onChange([...info, editing], { persistImmediately: true, successMessage: '已揭示信息新增已保存到文件' }); } setEditing(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">保存并落盘</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PlotRulesSection({
  rules,
  onChange,
}: {
  rules: string[];
  onChange: (
    r: string[],
    options?: { persistImmediately?: boolean; successMessage?: string }
  ) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState<{ idx: number; text: string } | null>(null);

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">创作规则</h3>
        <span className="text-gray-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>
      {!collapsed && (
        <div className="p-4 space-y-3">
          <button onClick={() => setEditing({ idx: -1, text: '' })} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md">+ 添加规则</button>
          {rules.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">暂无创作规则</p> : (
            <ol className="space-y-2 list-decimal list-inside">
              {rules.map((r, i) => (
                <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start justify-between group">
                  <span className="flex-1">{r}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditing({ idx: i, text: r })} className="text-blue-600 hover:text-blue-700 text-xs">编辑</button>
                    <button onClick={() => onChange(rules.filter((_, idx) => idx !== i), { persistImmediately: true, successMessage: '创作规则删除已保存到文件' })} className="text-red-600 hover:text-red-700 text-xs">删除</button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {editing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full p-6 space-y-4">
                <h3 className="text-lg font-semibold">{editing.idx >= 0 ? '编辑规则' : '添加规则'}</h3>
                <textarea value={editing.text} onChange={e => setEditing({...editing, text: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-md text-sm">取消</button>
                  <button onClick={() => { if (editing.idx >= 0) { const n = [...rules]; n[editing.idx] = editing.text; onChange(n, { persistImmediately: true, successMessage: '创作规则修改已保存到文件' }); } else { onChange([...rules, editing.text], { persistImmediately: true, successMessage: '创作规则新增已保存到文件' }); } setEditing(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm">保存并落盘</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PatternKeywordsSection({
  keywords,
  onChange,
}: {
  keywords: Record<string, string>;
  onChange: (
    k: Record<string, string>,
    options?: { persistImmediately?: boolean; successMessage?: string }
  ) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState<{ key: string; pattern: string; label: string } | null>(null);

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">套路检测关键词</h3>
        <span className="text-gray-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>
      {!collapsed && (
        <div className="p-4 space-y-3">
          <button onClick={() => setEditing({ key: '', pattern: '', label: '' })} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md">+ 添加关键词</button>
          {Object.keys(keywords).length === 0 ? <p className="text-sm text-gray-400 text-center py-8">暂无关键词</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">正则模式</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">标签</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {Object.entries(keywords).map(([pattern, label]) => (
                    <tr key={pattern}>
                      <td className="px-3 py-2 font-mono text-xs text-gray-900 dark:text-gray-100">{pattern}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{label}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => setEditing({ key: pattern, pattern, label })} className="text-blue-600 hover:text-blue-700 text-xs mr-2">编辑</button>
                        <button onClick={() => { const n = {...keywords}; delete n[pattern]; onChange(n, { persistImmediately: true, successMessage: '套路检测关键词删除已保存到文件' }); }} className="text-red-600 hover:text-red-700 text-xs">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {editing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full p-6 space-y-4">
                <h3 className="text-lg font-semibold">{editing.key ? '编辑关键词' : '添加关键词'}</h3>
                <input placeholder="正则模式" value={editing.pattern} onChange={e => setEditing({...editing, pattern: e.target.value})} disabled={!!editing.key} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700 font-mono text-sm disabled:opacity-50" />
                <input placeholder="标签" value={editing.label} onChange={e => setEditing({...editing, label: e.target.value})} className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-md text-sm">取消</button>
                  <button onClick={() => { const n = {...keywords}; if (editing.key && editing.key !== editing.pattern) delete n[editing.key]; n[editing.pattern] = editing.label; onChange(n, { persistImmediately: true, successMessage: editing.key ? '套路检测关键词修改已保存到文件' : '套路检测关键词新增已保存到文件' }); setEditing(null); }} disabled={!editing.pattern.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50">保存并落盘</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ConceptsSection({
  concepts,
  onChange,
}: {
  concepts: Record<string, ConceptFact>;
  onChange: (
    concepts: Record<string, ConceptFact>,
    options?: { persistImmediately?: boolean; successMessage?: string }
  ) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState<{ key: string; data: ConceptFact } | null>(null);

  const entries = Object.entries(concepts).sort(([, a], [, b]) => a.chapter - b.chapter);

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">概念 / 术语</h3>
        <span className="text-gray-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>
      {!collapsed && (
        <div className="p-4 space-y-3">
          <button onClick={() => setEditing({ key: '', data: { chapter: 1, category: '', definition: '', details: [] } })} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md">+ 添加概念</button>
          {entries.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">暂无概念/术语数据</p> : (
            <div className="space-y-2">
              {entries.map(([key, item]) => (
                <div key={key} className="border border-gray-200 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-zinc-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{key}</div>
                        {item.category && <span className="px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{item.category}</span>}
                        <span className="text-xs text-gray-500">第{item.chapter}章</span>
                      </div>
                      {item.definition && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">{item.definition}</p>}
                      {item.details.length > 0 && (
                        <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-gray-500 dark:text-gray-500">
                          {item.details.map((detail, idx) => <li key={idx}>{detail}</li>)}
                        </ul>
                      )}
                    </div>
                    <button onClick={() => setEditing({ key, data: item })} className="text-blue-600 hover:text-blue-700 text-xs">编辑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {editing && (
            <ConceptModal
              conceptKey={editing.key}
              concept={editing.data}
              onSave={(key, data) => {
                const next = { ...concepts };
                if (editing.key && editing.key !== key) delete next[editing.key];
                next[key] = data;
                onChange(next, { persistImmediately: true, successMessage: editing.key ? '概念/术语修改已保存到文件' : '概念/术语新增已保存到文件' });
                setEditing(null);
              }}
              onDelete={editing.key ? () => {
                const next = { ...concepts };
                delete next[editing.key];
                onChange(next, { persistImmediately: true, successMessage: '概念/术语删除已保存到文件' });
                setEditing(null);
              } : undefined}
              onClose={() => setEditing(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function KeyDataSection({
  keyData,
  onChange,
}: {
  keyData: Record<string, KeyDataFact>;
  onChange: (
    keyData: Record<string, KeyDataFact>,
    options?: { persistImmediately?: boolean; successMessage?: string }
  ) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState<{ key: string; data: KeyDataFact } | null>(null);

  const entries = Object.entries(keyData).sort(([, a], [, b]) => a.chapter - b.chapter);

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">关键数据点</h3>
        <span className="text-gray-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>
      {!collapsed && (
        <div className="p-4 space-y-3">
          <button onClick={() => setEditing({ key: '', data: { chapter: 1, category: '', details: [] } })} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md">+ 添加数据点</button>
          {entries.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">暂无关键数据点</p> : (
            <div className="space-y-2">
              {entries.map(([key, item]) => (
                <div key={key} className="border border-gray-200 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-zinc-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{key}</div>
                        {item.category && <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{item.category}</span>}
                        <span className="text-xs text-gray-500">第{item.chapter}章</span>
                      </div>
                      {item.details.length > 0 && (
                        <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                          {item.details.map((detail, idx) => <li key={idx}>{detail}</li>)}
                        </ul>
                      )}
                    </div>
                    <button onClick={() => setEditing({ key, data: item })} className="text-blue-600 hover:text-blue-700 text-xs">编辑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {editing && (
            <KeyDataModal
              itemKey={editing.key}
              item={editing.data}
              onSave={(key, data) => {
                const next = { ...keyData };
                if (editing.key && editing.key !== key) delete next[editing.key];
                next[key] = data;
                onChange(next, { persistImmediately: true, successMessage: editing.key ? '关键数据点修改已保存到文件' : '关键数据点新增已保存到文件' });
                setEditing(null);
              }}
              onDelete={editing.key ? () => {
                const next = { ...keyData };
                delete next[editing.key];
                onChange(next, { persistImmediately: true, successMessage: '关键数据点删除已保存到文件' });
                setEditing(null);
              } : undefined}
              onClose={() => setEditing(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

export function TimelineSection({
  timeline,
  onChange,
}: {
  timeline: TimelineEntry[];
  onChange: (
    timeline: TimelineEntry[],
    options?: { persistImmediately?: boolean; successMessage?: string }
  ) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState<{ index: number; data: TimelineEntry } | null>(null);

  const sorted = [...timeline].sort((a, b) => a.chapter - b.chapter);

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">关键事件时间线</h3>
        <span className="text-gray-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>
      {!collapsed && (
        <div className="p-4 space-y-3">
          <button onClick={() => setEditing({ index: -1, data: { chapter: 1, day: '', title: '', summary: '' } })} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md">+ 添加时间线节点</button>
          {sorted.length === 0 ? <p className="text-sm text-gray-400 text-center py-8">暂无时间线数据</p> : (
            <div className="space-y-3">
              {sorted.map((item) => {
                const originalIndex = timeline.findIndex(t => t.chapter === item.chapter && t.title === item.title && t.day === item.day && t.summary === item.summary);
                return (
                  <div key={`${item.chapter}-${item.title}`} className="border-l-4 border-blue-500 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-r-md p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">第{item.chapter}章</span>
                          {item.day && <span className="px-2 py-0.5 rounded text-xs bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">{item.day}</span>}
                        </div>
                        <div className="mt-1 text-base font-medium text-gray-800 dark:text-gray-200">{item.title}</div>
                        {item.summary && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{item.summary}</p>}
                      </div>
                      <button onClick={() => setEditing({ index: originalIndex, data: item })} className="text-blue-600 hover:text-blue-700 text-xs">编辑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {editing && (
            <TimelineModal
              entry={editing.data}
              isNew={editing.index < 0}
              onSave={(entry) => {
                const next = [...timeline];
                if (editing.index >= 0) next[editing.index] = entry;
                else next.push(entry);
                onChange(next, { persistImmediately: true, successMessage: editing.index >= 0 ? '时间线修改已保存到文件' : '时间线新增已保存到文件' });
                setEditing(null);
              }}
              onDelete={editing.index >= 0 ? () => {
                onChange(timeline.filter((_, idx) => idx !== editing.index), { persistImmediately: true, successMessage: '时间线节点删除已保存到文件' });
                setEditing(null);
              } : undefined}
              onClose={() => setEditing(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TechLineModal({
  techKey,
  techLine,
  onSave,
  onDelete,
  onClose,
}: {
  techKey: string;
  techLine: TechLineFact;
  onSave: (key: string, data: TechLineFact) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [key, setKey] = useState(techKey);
  const [data, setData] = useState(techLine);
  const isNew = !techKey;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isNew ? '添加技术线' : '编辑技术线'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              技术名 {isNew && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={!isNew}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">当前版本</label>
              <input
                type="text"
                value={data.currentVersion}
                onChange={(e) => setData({ ...data, currentVersion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">截至卷</label>
              <input
                type="number"
                value={data.asOfVolume}
                onChange={(e) => setData({ ...data, asOfVolume: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">截至章</label>
              <input
                type="number"
                value={data.asOfChapter}
                onChange={(e) => setData({ ...data, asOfChapter: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">规则</label>
            <input
              type="text"
              value={data.rule}
              onChange={(e) => setData({ ...data, rule: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              演进历程（每行一个阶段）
            </label>
            <textarea
              rows={4}
              value={data.progression.join('\n')}
              onChange={(e) => setData({ ...data, progression: e.target.value.split('\n').filter(Boolean) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 px-6 py-4 flex justify-between">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
              >
                删除
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              取消
            </button>
            <button
              onClick={() => onSave(key, data)}
              disabled={!key.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm"
            >
              保存并落盘
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConceptModal({
  conceptKey,
  concept,
  onSave,
  onDelete,
  onClose,
}: {
  conceptKey: string;
  concept: ConceptFact;
  onSave: (key: string, data: ConceptFact) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [key, setKey] = useState(conceptKey);
  const [data, setData] = useState(concept);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{conceptKey ? '编辑概念/术语' : '添加概念/术语'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="概念名" className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
          <div className="grid grid-cols-2 gap-4">
            <input value={data.category} onChange={(e) => setData({ ...data, category: e.target.value })} placeholder="分类" className="px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
            <input type="number" value={data.chapter} onChange={(e) => setData({ ...data, chapter: parseInt(e.target.value) || 0 })} placeholder="章节" className="px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
          </div>
          <textarea value={data.definition} onChange={(e) => setData({ ...data, definition: e.target.value })} rows={4} placeholder="定义" className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
          <textarea value={data.details.join('\n')} onChange={(e) => setData({ ...data, details: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} rows={5} placeholder="补充细节（每行一条）" className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 px-6 py-4 flex justify-between">
          <div>{onDelete && <button onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm">删除</button>}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">取消</button>
            <button onClick={() => onSave(key, data)} disabled={!key.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50">保存并落盘</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyDataModal({
  itemKey,
  item,
  onSave,
  onDelete,
  onClose,
}: {
  itemKey: string;
  item: KeyDataFact;
  onSave: (key: string, data: KeyDataFact) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [key, setKey] = useState(itemKey);
  const [data, setData] = useState(item);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{itemKey ? '编辑关键数据点' : '添加关键数据点'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="数据点名称" className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
          <div className="grid grid-cols-2 gap-4">
            <input value={data.category} onChange={(e) => setData({ ...data, category: e.target.value })} placeholder="分类" className="px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
            <input type="number" value={data.chapter} onChange={(e) => setData({ ...data, chapter: parseInt(e.target.value) || 0 })} placeholder="章节" className="px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
          </div>
          <textarea value={data.details.join('\n')} onChange={(e) => setData({ ...data, details: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} rows={6} placeholder="详细数据（每行一条）" className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 px-6 py-4 flex justify-between">
          <div>{onDelete && <button onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm">删除</button>}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">取消</button>
            <button onClick={() => onSave(key, data)} disabled={!key.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50">保存并落盘</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineModal({
  entry,
  isNew,
  onSave,
  onDelete,
  onClose,
}: {
  entry: TimelineEntry;
  isNew: boolean;
  onSave: (entry: TimelineEntry) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [data, setData] = useState(entry);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full">
        <div className="border-b dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{isNew ? '添加时间线节点' : '编辑时间线节点'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={data.chapter} onChange={(e) => setData({ ...data, chapter: parseInt(e.target.value) || 0 })} placeholder="章节" className="px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
            <input value={data.day} onChange={(e) => setData({ ...data, day: e.target.value })} placeholder="时间标记，如 Day 529-531" className="px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
          </div>
          <input value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} placeholder="标题" className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
          <textarea value={data.summary} onChange={(e) => setData({ ...data, summary: e.target.value })} rows={5} placeholder="概要" className="w-full px-3 py-2 border rounded-md dark:bg-zinc-950 dark:border-zinc-700" />
        </div>
        <div className="border-t dark:border-zinc-800 px-6 py-4 flex justify-between">
          <div>{onDelete && <button onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm">删除</button>}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-md text-sm">取消</button>
            <button onClick={() => onSave(data)} disabled={!data.title.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50">保存并落盘</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Factions Section
// ============================================================================

interface FactionsSectionProps {
  factions: Record<string, FactionFact>;
  onChange: (
    factions: Record<string, FactionFact>,
    options?: { persistImmediately?: boolean; successMessage?: string }
  ) => void;
}

export function FactionsSection({ factions, onChange }: FactionsSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState<{ key: string; data: FactionFact } | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const entries = Object.entries(factions);

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">势力/组织</h3>
        <span className="text-gray-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="p-4 space-y-3">
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
          >
            + 添加组织
          </button>

          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">暂无组织数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">组织名</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">状态</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">截至卷</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">备注</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {entries.map(([key, faction]) => (
                    <tr key={key}>
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{key}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{faction.status}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">卷{faction.asOfVolume}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400 max-w-xs truncate">{faction.note || '-'}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setEditing({ key, data: faction })}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs"
                        >
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {editing && (
            <FactionModal
              factionKey={editing.key}
              faction={editing.data}
              onSave={(key, data) => {
                const newFactions = { ...factions };
                if (key !== editing.key) delete newFactions[editing.key];
                newFactions[key] = data;
                onChange(newFactions, { persistImmediately: true, successMessage: '势力/组织修改已保存到文件' });
                setEditing(null);
              }}
              onDelete={() => {
                const newFactions = { ...factions };
                delete newFactions[editing.key];
                onChange(newFactions, { persistImmediately: true, successMessage: '势力/组织删除已保存到文件' });
                setEditing(null);
              }}
              onClose={() => setEditing(null)}
            />
          )}

          {showAdd && (
            <FactionModal
              factionKey=""
              faction={{ status: '', asOfVolume: 1, note: '' }}
              onSave={(key, data) => {
                onChange({ ...factions, [key]: data }, { persistImmediately: true, successMessage: '势力/组织新增已保存到文件' });
                setShowAdd(false);
              }}
              onClose={() => setShowAdd(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function FactionModal({
  factionKey,
  faction,
  onSave,
  onDelete,
  onClose,
}: {
  factionKey: string;
  faction: FactionFact;
  onSave: (key: string, data: FactionFact) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [key, setKey] = useState(factionKey);
  const [data, setData] = useState(faction);
  const isNew = !factionKey;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-lg w-full">
        <div className="border-b dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isNew ? '添加组织' : '编辑组织'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              组织名 {isNew && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={!isNew}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
              <input
                type="text"
                value={data.status}
                onChange={(e) => setData({ ...data, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">截至卷</label>
              <input
                type="number"
                value={data.asOfVolume}
                onChange={(e) => setData({ ...data, asOfVolume: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注</label>
            <textarea
              rows={3}
              value={data.note}
              onChange={(e) => setData({ ...data, note: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="border-t dark:border-zinc-800 px-6 py-4 flex justify-between">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
              >
                删除
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
            >
              取消
            </button>
            <button
              onClick={() => onSave(key, data)}
              disabled={!key.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm"
            >
              保存并落盘
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
