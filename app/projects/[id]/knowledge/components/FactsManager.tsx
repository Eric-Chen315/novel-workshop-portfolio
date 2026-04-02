'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  FactRegistry,
  CharacterFact,
  TechLineFact,
  FactionFact,
} from '@/lib/factsManager';
import type { ExtractionReport } from '@/lib/factsExtractor';
import { 
  TechLinesSection, 
  FactionsSection, 
  MajorEventsSection, 
  RevealedInfoSection, 
  PlotRulesSection, 
  PatternKeywordsSection,
  ConceptsSection,
  KeyDataSection,
  TimelineSection,
} from './FactsManagerSections';

interface FactsManagerProps {
  projectId: string;
}

export function FactsManager({ projectId }: FactsManagerProps) {
  const [facts, setFacts] = useState<FactRegistry | null>(null);
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // 事实提取相关状态
  const [availableVolumes, setAvailableVolumes] = useState<number[]>([]);
  const [selectedVolume, setSelectedVolume] = useState<number | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractionReport, setExtractionReport] = useState<ExtractionReport | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const persistFacts = useCallback(async (
    nextFacts: FactRegistry,
    options?: { successMessage?: string; keepDirtyOnSuccess?: boolean }
  ) => {
    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/projects/${projectId}/knowledge/facts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextFacts),
      });

      if (!response.ok) {
        throw new Error('保存失败');
      }

      const savedFacts: FactRegistry = await response.json();
      setFacts(savedFacts);
      setHasChanges(Boolean(options?.keepDirtyOnSuccess));

      const event = new CustomEvent('toast', {
        detail: { message: options?.successMessage ?? '事实注册表已保存', type: 'success' }
      });
      window.dispatchEvent(event);

      return savedFacts;
    } catch {
      setHasChanges(true);
      setError('保存失败，请重试');
      const event = new CustomEvent('toast', {
        detail: { message: '保存失败', type: 'error' }
      });
      window.dispatchEvent(event);
      return null;
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  const loadFacts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}/knowledge/facts`, {
        cache: 'no-store',
      });
      const data = await response.json();
      
      if (data.exists) {
        setExists(true);
        setFacts({
          version: data.version,
          lastUpdated: data.lastUpdated,
          updatedAt: data.updatedAt || data.lastUpdated,
          characters: data.characters || {},
          techLines: data.techLines || {},
          factions: data.factions || {},
          majorEvents: data.majorEvents || [],
          revealedInfo: data.revealedInfo || [],
          plotRules: data.plotRules || [],
          bannedExpressions: data.bannedExpressions || [],
          patternKeywords: data.patternKeywords || {},
          concepts: data.concepts || {},
          keyData: data.keyData || {},
          timeline: data.timeline || [],
        });
      } else {
        setExists(false);
      }
    } catch (err) {
      setError('加载事实注册表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  async function createEmptyTemplate() {
    const emptyFacts: FactRegistry = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characters: {},
      techLines: {},
      factions: {},
      majorEvents: [],
      revealedInfo: [],
      plotRules: [],
      bannedExpressions: [],
      patternKeywords: {},
      concepts: {},
      keyData: {},
      timeline: [],
    };
    
    try {
      const response = await fetch(`/api/projects/${projectId}/knowledge/facts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emptyFacts),
      });
      
      if (response.ok) {
        const savedFacts: FactRegistry = await response.json();
        setFacts(savedFacts);
        setExists(true);
        setHasChanges(false);
        const event = new CustomEvent('toast', {
          detail: { message: '已创建事实注册表模板', type: 'success' }
        });
        window.dispatchEvent(event);
      } else {
        throw new Error('创建模板失败');
      }
    } catch (err) {
      setError('创建模板失败');
      console.error(err);
    }
  }

  const loadAvailableVolumes = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/knowledge/outline`);
      if (response.ok) {
        const data = await response.json();
        if (data.volumes && Array.isArray(data.volumes)) {
          const volumeNums = data.volumes.map((v: { volumeNum: number }) => v.volumeNum).sort((a: number, b: number) => a - b);
          setAvailableVolumes(volumeNums);
          if (volumeNums.length > 0) {
            setSelectedVolume(volumeNums[0]);
          }
        }
      }
    } catch (err) {
      console.error('加载卷列表失败:', err);
    }
  }, [projectId]);

  useEffect(() => {
    loadFacts();
    loadAvailableVolumes();
  }, [loadFacts, loadAvailableVolumes]);

  async function handleExtract() {
    if (!selectedVolume) return;
    
    try {
      setExtracting(true);
      setError('');
      setExtractionReport(null);
      
      const response = await fetch(`/api/projects/${projectId}/knowledge/facts/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volumeNumber: selectedVolume }),
      });
      
      if (response.ok) {
        const report: ExtractionReport = await response.json();
        setExtractionReport(report);
        
        // 默认全选所有提取项
        const allItems = new Set<string>();
        Object.keys(report.extractedFacts.characters).forEach(k => allItems.add(`char:${k}`));
        Object.keys(report.extractedFacts.techLines).forEach(k => allItems.add(`tech:${k}`));
        Object.keys(report.extractedFacts.factions).forEach(k => allItems.add(`faction:${k}`));
        report.extractedFacts.majorEvents.forEach((_, i) => allItems.add(`event:${i}`));
        report.extractedFacts.revealedInfo.forEach((_, i) => allItems.add(`info:${i}`));
        setSelectedItems(allItems);
      } else {
        throw new Error('提取失败');
      }
    } catch {
      setError('事实提取失败，请重试');
      const event = new CustomEvent('toast', {
        detail: { message: '事实提取失败', type: 'error' }
      });
      window.dispatchEvent(event);
    } finally {
      setExtracting(false);
    }
  }

  async function handleMerge() {
    if (!extractionReport || !facts) return;
    
    try {
      // 构建要合并的数据
      const incoming: Partial<FactRegistry> = {
        characters: {},
        techLines: {},
        factions: {},
        majorEvents: [],
        revealedInfo: [],
      };
      
      // 只包含被选中的项
      Object.entries(extractionReport.extractedFacts.characters).forEach(([key, value]) => {
        if (selectedItems.has(`char:${key}`)) {
          incoming.characters![key] = value as CharacterFact;
        }
      });
      
      Object.entries(extractionReport.extractedFacts.techLines).forEach(([key, value]) => {
        if (selectedItems.has(`tech:${key}`)) {
          incoming.techLines![key] = value as TechLineFact;
        }
      });

      Object.entries(extractionReport.extractedFacts.factions).forEach(([key, value]) => {
        if (selectedItems.has(`faction:${key}`)) {
          incoming.factions![key] = value as FactionFact;
        }
      });
      
      extractionReport.extractedFacts.majorEvents.forEach((event, i) => {
        if (selectedItems.has(`event:${i}`)) {
          incoming.majorEvents!.push({ ...event, id: `${event.volume}-${event.chapter}-${Date.now()}` });
        }
      });
      
      extractionReport.extractedFacts.revealedInfo.forEach((info, i) => {
        if (selectedItems.has(`info:${i}`)) {
          incoming.revealedInfo!.push({ ...info, id: `${info.volume}-${info.chapter}-${Date.now()}` });
        }
      });
      
      const response = await fetch(`/api/projects/${projectId}/knowledge/facts/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incoming }),
      });
      
      if (response.ok) {
        const mergedFacts = await response.json();
        setFacts(mergedFacts);
        setExtractionReport(null);
        setSelectedItems(new Set());
        
        const selectedCount = selectedItems.size;
        const event = new CustomEvent('toast', {
          detail: { message: `已合并 ${selectedCount} 条新增事实`, type: 'success' }
        });
        window.dispatchEvent(event);
      } else {
        throw new Error('合并失败');
      }
    } catch {
      setError('事实合并失败，请重试');
      const event = new CustomEvent('toast', {
        detail: { message: '事实合并失败', type: 'error' }
      });
      window.dispatchEvent(event);
    }
  }

  async function handleSave() {
    if (!facts) return;

    await persistFacts(facts);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-gray-500">加载中...</span>
      </div>
    );
  }

  if (!exists) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-gray-500 text-center max-w-md">
          尚未创建事实注册表。可在新书向导 Step 5 生成细纲后自动创建，或点击下方按钮手动创建。
        </p>
        <button
          onClick={createEmptyTemplate}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
        >
          创建空模板
        </button>
      </div>
    );
  }

  if (!facts) return null;

  return (
    <div className="space-y-6">
      {/* Header with metadata and save button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 space-x-4">
          <span>版本: {facts.version}</span>
          <span>最后更新: {new Date(facts.lastUpdated).toLocaleString('zh-CN')}</span>
          <span>数据更新时间: {new Date(facts.updatedAt || facts.lastUpdated).toLocaleString('zh-CN')}</span>
          {hasChanges && <span className="text-amber-600 dark:text-amber-400">当前有未落盘修改</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`px-6 py-2.5 rounded-md font-medium transition-colors ${
            hasChanges && !saving
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? '保存中...' : '保存到文件'}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Facts Extraction Section */}
      <div className="border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden bg-purple-50/30 dark:bg-purple-950/20">
        <div className="px-4 py-3 bg-purple-100 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-800">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
            <span>📥</span>
            <span>增量事实提取</span>
          </h3>
        </div>
        
        <div className="p-4 space-y-4">
          {!extractionReport ? (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">从卷:</label>
              <select
                value={selectedVolume || ''}
                onChange={(e) => setSelectedVolume(parseInt(e.target.value))}
                disabled={extracting || availableVolumes.length === 0}
                className="px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              >
                {availableVolumes.length === 0 ? (
                  <option value="">无可用卷</option>
                ) : (
                  availableVolumes.map(vol => (
                    <option key={vol} value={vol}>第 {vol} 卷</option>
                  ))
                )}
              </select>
              
              <button
                onClick={handleExtract}
                disabled={extracting || !selectedVolume}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors flex items-center gap-2"
              >
                {extracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>提取中...</span>
                  </>
                ) : (
                  <span>开始提取</span>
                )}
              </button>
            </div>
          ) : (
            <ExtractionPreview
              report={extractionReport}
              selectedItems={selectedItems}
              onToggleItem={(itemId) => {
                const newSelected = new Set(selectedItems);
                if (newSelected.has(itemId)) {
                  newSelected.delete(itemId);
                } else {
                  newSelected.add(itemId);
                }
                setSelectedItems(newSelected);
              }}
              onConfirm={handleMerge}
              onCancel={() => {
                setExtractionReport(null);
                setSelectedItems(new Set());
              }}
            />
          )}
        </div>
      </div>

      {/* Characters Section */}
      <CharactersSection
        characters={facts.characters}
        onChange={(characters, options) => {
          const nextFacts = { ...facts, characters };
          setFacts(nextFacts);
          setHasChanges(true);

          if (options?.persistImmediately) {
            void persistFacts(nextFacts, {
              successMessage: options.successMessage ?? '角色修改已自动保存',
            });
          }
        }}
      />

      {/* Tech Lines Section */}
      <TechLinesSection
        techLines={facts.techLines}
        onChange={(techLines, options) => {
          const nextFacts = { ...facts, techLines };
          setFacts(nextFacts);
          setHasChanges(true);

          if (options?.persistImmediately) {
            void persistFacts(nextFacts, {
              successMessage: options.successMessage ?? '技术线修改已自动保存',
            });
          }
        }}
      />

      {/* Factions Section */}
      <FactionsSection
        factions={facts.factions}
        onChange={(factions, options) => {
          const nextFacts = { ...facts, factions };
          setFacts(nextFacts);
          setHasChanges(true);

          if (options?.persistImmediately) {
            void persistFacts(nextFacts, {
              successMessage: options.successMessage ?? '势力/组织修改已自动保存',
            });
          }
        }}
      />

      {/* Major Events Section */}
      <MajorEventsSection
        events={facts.majorEvents}
        onChange={(majorEvents, options) => {
          const nextFacts = { ...facts, majorEvents };
          setFacts(nextFacts);
          setHasChanges(true);

          if (options?.persistImmediately) {
            void persistFacts(nextFacts, {
              successMessage: options.successMessage ?? '不可逆事件修改已自动保存',
            });
          }
        }}
      />

      {/* Revealed Info Section */}
      <RevealedInfoSection
        info={facts.revealedInfo}
        onChange={(revealedInfo, options) => {
          const nextFacts = { ...facts, revealedInfo };
          setFacts(nextFacts);
          setHasChanges(true);

          if (options?.persistImmediately) {
            void persistFacts(nextFacts, {
              successMessage: options.successMessage ?? '已揭示信息修改已自动保存',
            });
          }
        }}
      />

      {/* Plot Rules Section */}
      <PlotRulesSection
        rules={facts.plotRules}
        onChange={(plotRules, options) => {
          const nextFacts = { ...facts, plotRules };
          setFacts(nextFacts);
          setHasChanges(true);

          if (options?.persistImmediately) {
            void persistFacts(nextFacts, {
              successMessage: options.successMessage ?? '创作规则修改已自动保存',
            });
          }
        }}
      />

      {/* Pattern Keywords Section */}
      <PatternKeywordsSection
        keywords={facts.patternKeywords}
        onChange={(patternKeywords, options) => {
          const nextFacts = { ...facts, patternKeywords };
          setFacts(nextFacts);
          setHasChanges(true);

          if (options?.persistImmediately) {
            void persistFacts(nextFacts, {
              successMessage: options.successMessage ?? '套路检测关键词修改已自动保存',
            });
          }
        }}
      />

      <ConceptsSection
        concepts={facts.concepts || {}}
        onChange={(concepts, options) => {
          const nextFacts = { ...facts, concepts };
          setFacts(nextFacts);
          setHasChanges(true);

          if (options?.persistImmediately) {
            void persistFacts(nextFacts, {
              successMessage: options.successMessage ?? '概念/术语修改已自动保存',
            });
          }
        }}
      />

      <KeyDataSection
        keyData={facts.keyData || {}}
        onChange={(keyData, options) => {
          const nextFacts = { ...facts, keyData };
          setFacts(nextFacts);
          setHasChanges(true);

          if (options?.persistImmediately) {
            void persistFacts(nextFacts, {
              successMessage: options.successMessage ?? '关键数据点修改已自动保存',
            });
          }
        }}
      />

      <TimelineSection
        timeline={facts.timeline || []}
        onChange={(timeline, options) => {
          const nextFacts = { ...facts, timeline };
          setFacts(nextFacts);
          setHasChanges(true);

          if (options?.persistImmediately) {
            void persistFacts(nextFacts, {
              successMessage: options.successMessage ?? '时间线修改已自动保存',
            });
          }
        }}
      />
    </div>
  );
}

// ============================================================================
// Extraction Preview Component
// ============================================================================

interface ExtractionPreviewProps {
  report: ExtractionReport;
  selectedItems: Set<string>;
  onToggleItem: (itemId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function ExtractionPreview({ report, selectedItems, onToggleItem, onConfirm, onCancel }: ExtractionPreviewProps) {
  const { extractedFacts, confidence, warnings, sourceVolume } = report;
  
  const confidenceColors = {
    high: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    low: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  
  const confidenceIcons = {
    high: '🟢',
    medium: '🟡',
    low: '🔴',
  };
  
  const confidenceLabels = {
    high: '高',
    medium: '中',
    low: '低',
  };
  
  const charEntries = Object.entries(extractedFacts.characters);
  const techEntries = Object.entries(extractedFacts.techLines);
  const factionEntries = Object.entries(extractedFacts.factions);
  const events = extractedFacts.majorEvents;
  const infos = extractedFacts.revealedInfo;
  
  const totalItems = charEntries.length + techEntries.length + factionEntries.length + events.length + infos.length;
  
  if (totalItems === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-gray-600 dark:text-gray-400">本卷未发现新增事实变化</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md text-sm transition-colors"
        >
          关闭
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          📋 提取结果预览（第{sourceVolume}卷）
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">置信度：</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${confidenceColors[confidence]}`}>
            {confidenceIcons[confidence]} {confidenceLabels[confidence]}
          </span>
        </div>
      </div>
      
      {/* Low confidence warning */}
      {confidence === 'low' && (
        <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
            ⚠️ 提取置信度较低，请仔细核查每条结果
          </p>
        </div>
      )}
      
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-3">
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">⚠️ 不确定项（需人工确认）</p>
          <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Extracted items */}
      <div className="border border-gray-200 dark:border-zinc-800 rounded-md divide-y divide-gray-200 dark:divide-zinc-800 max-h-96 overflow-y-auto">
        {/* Characters */}
        {charEntries.length > 0 && (
          <div className="p-3">
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">■ 角色状态变化（{charEntries.length}项）</h5>
            <div className="space-y-2">
              {charEntries.map(([key, char]) => (
                <label key={key} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(`char:${key}`)}
                    onChange={() => onToggleItem(`char:${key}`)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{key}</span>: {char.status}
                    {char.lastSeenVolume && char.lastSeenChapter && (
                      <span className="text-gray-500"> （第{char.lastSeenVolume}卷第{char.lastSeenChapter}章）</span>
                    )}
                    {char.note && <span className="text-gray-500"> - {char.note}</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Tech Lines */}
        {techEntries.length > 0 && (
          <div className="p-3">
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">■ 技术线更新（{techEntries.length}项）</h5>
            <div className="space-y-2">
              {techEntries.map(([key, tech]) => (
                <label key={key} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(`tech:${key}`)}
                    onChange={() => onToggleItem(`tech:${key}`)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{key}</span>: {tech.currentVersion}
                    {tech.asOfVolume && tech.asOfChapter && (
                      <span className="text-gray-500"> （第{tech.asOfVolume}卷第{tech.asOfChapter}章）</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Factions */}
        {factionEntries.length > 0 && (
          <div className="p-3">
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">■ 势力更新（{factionEntries.length}项）</h5>
            <div className="space-y-2">
              {factionEntries.map(([key, faction]) => (
                <label key={key} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(`faction:${key}`)}
                    onChange={() => onToggleItem(`faction:${key}`)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{key}</span>: {faction.status || '未标注状态'}
                    {faction.asOfVolume && (
                      <span className="text-gray-500"> （截至第{faction.asOfVolume}卷）</span>
                    )}
                    {faction.note && <span className="text-gray-500"> - {faction.note}</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Major Events */}
        {events.length > 0 && (
          <div className="p-3">
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">■ 新增不可逆事件（{events.length}项）</h5>
            <div className="space-y-2">
              {events.map((event, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(`event:${i}`)}
                    onChange={() => onToggleItem(`event:${i}`)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {event.event}
                    <span className="text-gray-500"> （第{event.volume}卷第{event.chapter}章）</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Revealed Info */}
        {infos.length > 0 && (
          <div className="p-3">
            <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">■ 新增已揭示信息（{infos.length}项）</h5>
            <div className="space-y-2">
              {infos.map((info, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(`info:${i}`)}
                    onChange={() => onToggleItem(`info:${i}`)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {info.info}
                    <span className="text-gray-500"> （第{info.volume}卷第{info.chapter}章）</span>
                    {info.note && <span className="text-gray-500"> - {info.note}</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          已选择 {selectedItems.size} / {totalItems} 项
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            放弃
          </button>
          <button
            onClick={onConfirm}
            disabled={selectedItems.size === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm transition-colors"
          >
            确认并合并
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Characters Section
// ============================================================================

interface CharactersSectionProps {
  characters: Record<string, CharacterFact>;
  onChange: (
    characters: Record<string, CharacterFact>,
    options?: { persistImmediately?: boolean; successMessage?: string }
  ) => void;
}

function CharactersSection({ characters, onChange }: CharactersSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingChar, setEditingChar] = useState<{ key: string; data: CharacterFact } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    eliminated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    exited: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    imprisoned: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    unknown: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  };

  const statusLabels = {
    active: '活跃',
    eliminated: '已死亡',
    exited: '已退场',
    imprisoned: '被囚禁',
    unknown: '未知',
  };

  const entries = Object.entries(characters);

  return (
    <div className="border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">角色状态</h3>
        <span className="text-gray-400 text-sm">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="p-4 space-y-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
          >
            + 添加角色
          </button>

          {entries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">暂无角色数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">角色名</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">状态</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">最后出现</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">禁止出场</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">备注</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {entries.map(([key, char]) => (
                    <tr
                      key={key}
                      className={char.cannotAppear ? 'bg-red-50 dark:bg-red-950/20' : ''}
                    >
                      <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{key}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[char.status]}`}>
                          {statusLabels[char.status]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                        卷{char.lastSeenVolume} 第{char.lastSeenChapter}章
                      </td>
                      <td className="px-3 py-2">
                        {char.cannotAppear && (
                          <span className="text-red-600 dark:text-red-400 font-medium">是</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {char.note || char.exitReason || '-'}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setEditingChar({ key, data: char })}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
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

          {/* Edit Modal */}
          {editingChar && (
            <CharacterEditModal
              charKey={editingChar.key}
              character={editingChar.data}
              onSave={(key, data) => {
                const newChars = { ...characters };
                if (key !== editingChar.key) {
                  delete newChars[editingChar.key];
                }
                newChars[key] = data;
                onChange(newChars, { persistImmediately: true, successMessage: '角色修改已保存到文件' });
                setEditingChar(null);
              }}
              onDelete={() => {
                const newChars = { ...characters };
                delete newChars[editingChar.key];
                onChange(newChars, { persistImmediately: true, successMessage: '角色删除已保存到文件' });
                setEditingChar(null);
              }}
              onClose={() => setEditingChar(null)}
            />
          )}

          {/* Add Modal */}
          {showAddModal && (
            <CharacterEditModal
              charKey=""
              character={{
                status: 'active',
                lastSeenVolume: 1,
                lastSeenChapter: 1,
                exitReason: null,
                cannotAppear: false,
                knownConditions: [],
                currentAbilities: [],
                note: '',
              }}
              onSave={(key, data) => {
                onChange({ ...characters, [key]: data }, { persistImmediately: true, successMessage: '角色新增已保存到文件' });
                setShowAddModal(false);
              }}
              onClose={() => setShowAddModal(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Character Edit Modal Component
interface CharacterEditModalProps {
  charKey: string;
  character: CharacterFact;
  onSave: (key: string, data: CharacterFact) => void;
  onDelete?: () => void;
  onClose: () => void;
}

function CharacterEditModal({ charKey, character, onSave, onDelete, onClose }: CharacterEditModalProps) {
  const [key, setKey] = useState(charKey);
  const [data, setData] = useState(character);
  const isNew = !charKey;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isNew ? '添加角色' : '编辑角色'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              角色名 {isNew && <span className="text-red-500">*</span>}
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
              <select
                value={data.status}
                onChange={(e) => setData({ ...data, status: e.target.value as CharacterFact['status'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
              >
                <option value="active">活跃</option>
                <option value="eliminated">已死亡</option>
                <option value="exited">已退场</option>
                <option value="imprisoned">被囚禁</option>
                <option value="unknown">未知</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.cannotAppear}
                  onChange={(e) => setData({ ...data, cannotAppear: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">禁止出场</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">最后出现卷</label>
              <input
                type="number"
                value={data.lastSeenVolume}
                onChange={(e) => setData({ ...data, lastSeenVolume: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">最后出现章</label>
              <input
                type="number"
                value={data.lastSeenChapter}
                onChange={(e) => setData({ ...data, lastSeenChapter: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">退场原因</label>
            <input
              type="text"
              value={data.exitReason || ''}
              onChange={(e) => setData({ ...data, exitReason: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              已知状况（每行一条）
            </label>
            <textarea
              rows={3}
              value={data.knownConditions.join('\n')}
              onChange={(e) => setData({ ...data, knownConditions: e.target.value.split('\n').filter(Boolean) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              当前能力（每行一条）
            </label>
            <textarea
              rows={3}
              value={data.currentAbilities.join('\n')}
              onChange={(e) => setData({ ...data, currentAbilities: e.target.value.split('\n').filter(Boolean) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注</label>
            <textarea
              rows={2}
              value={data.note}
              onChange={(e) => setData({ ...data, note: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 px-6 py-4 flex justify-between">
          <div>
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
              >
                删除
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => onSave(key, data)}
              disabled={!key.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-sm transition-colors"
            >
              保存并落盘
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
