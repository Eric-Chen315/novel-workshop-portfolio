'use client';

import { useState } from 'react';
import type { AutoSaveStatus } from '../hooks/useChapterState';
import type { BatchStatus } from '../hooks/useBatchGeneration';
import ActionBar from './ActionBar';

// ─── BatchReport sub-component ────────────────────────────────────────────────

function BatchReport({
  batchStatus,
  formatDuration,
  onClose,
}: {
  batchStatus: BatchStatus;
  formatDuration: (ms: number) => string;
  onClose: () => void;
}) {
  const successful = batchStatus.results.filter(r => r.success);
  const failed = batchStatus.results.filter(r => !r.success);
  const totalWords = successful.reduce((sum, r) => sum + r.wordCount, 0);
  const totalDuration = (batchStatus.endTime || 0) - (batchStatus.startTime || 0);

  return (
    <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-4">
      <h3 className="mb-3 text-lg font-bold text-zinc-800">批量生成报告</h3>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded bg-green-50 p-2">
          <div className="text-green-600">成功</div>
          <div className="text-xl font-bold text-green-700">{successful.length} 章</div>
        </div>
        <div className="rounded bg-red-50 p-2">
          <div className="text-red-600">失败</div>
          <div className="text-xl font-bold text-red-700">{failed.length} 章</div>
        </div>
        <div className="rounded bg-blue-50 p-2">
          <div className="text-blue-600">总字数</div>
          <div className="text-xl font-bold text-blue-700">{totalWords.toLocaleString()}</div>
        </div>
        <div className="rounded bg-purple-50 p-2">
          <div className="text-purple-600">总耗时</div>
          <div className="text-xl font-bold text-purple-700">{formatDuration(totalDuration)}</div>
        </div>
      </div>

      {successful.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-2 text-sm font-medium text-green-700">成功章节：</h4>
          <div className="max-h-32 overflow-y-auto text-xs text-zinc-600">
            {successful.map(r => (
              <div key={r.chapterNum} className="flex justify-between border-b border-zinc-100 py-1">
                <span>第{r.chapterNum}章 - {r.title}</span>
                <span>{r.wordCount}字</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {failed.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-red-700">失败章节：</h4>
          <div className="max-h-32 overflow-y-auto text-xs text-zinc-600">
            {failed.map(r => (
              <div key={r.chapterNum} className="flex justify-between border-b border-zinc-100 py-1 text-red-600">
                <span>第{r.chapterNum}章 - {r.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-3 w-full rounded bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
      >
        关闭报告
      </button>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  // Step / direction / basic inputs
  step: number;
  onStepChange: (s: number) => void;
  direction: string;
  onDirectionChange: (v: string) => void;
  extra: string;
  onExtraChange: (v: string) => void;
  // Hard constraints (collapsible)
  anchorsJson: string;
  onAnchorsJsonChange: (v: string) => void;
  forbiddenRules: string;
  onForbiddenRulesChange: (v: string) => void;
  // Meta info (collapsible)
  background: string;
  onBackgroundChange: (v: string) => void;
  chapterNo: string;
  onChapterNoChange: (v: string) => void;
  last3ShuangTypes: string;
  onLast3ShuangTypesChange: (v: string) => void;
  // Generating state
  isGenerating: boolean;
  currentGeneratingStep: number | null;
  // Batch generation
  batchStartChapter: string;
  onBatchStartChapterChange: (v: string) => void;
  batchEndChapter: string;
  onBatchEndChapterChange: (v: string) => void;
  batchStatus: BatchStatus;
  showBatchReport: boolean;
  onCloseBatchReport: () => void;
  onStartBatch: () => void;
  onPauseBatch: () => void;
  onStopBatch: () => void;
  getBatchProgress: () => number;
  formatDuration: (ms: number) => string;
  // Action bar
  onExecuteCurrentStep: () => void;
  onFullFlow: () => void;
  onRegenerate: () => void;
  autoSaveStatus: AutoSaveStatus;
  onRetrySave: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InputPanel({
  step, onStepChange,
  direction, onDirectionChange,
  extra, onExtraChange,
  anchorsJson, onAnchorsJsonChange,
  forbiddenRules, onForbiddenRulesChange,
  background, onBackgroundChange,
  chapterNo, onChapterNoChange,
  last3ShuangTypes, onLast3ShuangTypesChange,
  isGenerating, currentGeneratingStep,
  batchStartChapter, onBatchStartChapterChange,
  batchEndChapter, onBatchEndChapterChange,
  batchStatus, showBatchReport, onCloseBatchReport,
  onStartBatch, onPauseBatch, onStopBatch,
  getBatchProgress, formatDuration,
  onExecuteCurrentStep, onFullFlow, onRegenerate,
  autoSaveStatus, onRetrySave,
}: Props) {
  const [isHardConstraintsOpen, setIsHardConstraintsOpen] = useState(false);
  const [isMetaInfoOpen, setIsMetaInfoOpen] = useState(false);

  return (
    <div className="w-2/5 border-r border-zinc-200 bg-zinc-50 p-4">
      <h2 className="mb-4 text-lg font-bold text-zinc-800">输入面板</h2>

      {/* 步骤选择器 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-zinc-700">当前步骤</label>
        <select
          value={step}
          onChange={(e) => onStepChange(Number(e.target.value))}
          disabled={isGenerating}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value={1}>步骤 1 - 初稿生成</option>
          <option value={2}>步骤 2 - 读者反馈</option>
          <option value={3}>步骤 3 - 二稿修改</option>
          <option value={4}>步骤 4 - 审核报告</option>
          <option value={5}>步骤 5 - 终稿确定</option>
        </select>
      </div>

      {/* 章节方向 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          章节方向 <span className="text-red-500">*必填</span>
        </label>
        <textarea
          value={direction}
          onChange={(e) => onDirectionChange(e.target.value)}
          placeholder="选择章节后会自动加载 outline.json 对应细纲；也可在此基础上手动修改..."
          rows={6}
          disabled={isGenerating}
          className="w-full rounded-md border border-zinc-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-zinc-500">
          输入章节号后将自动尝试加载对应细纲；未匹配到 outline 时会保持为空，便于手动填写。
        </p>
      </div>

      {/* 特殊指令 */}
      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          特殊指令 <span className="text-zinc-400">(可选)</span>
        </label>
        <textarea
          value={extra}
          onChange={(e) => onExtraChange(e.target.value)}
          placeholder="特殊写作要求，如：增加反派对话、加入反转情节等..."
          rows={4}
          disabled={isGenerating}
          className="w-full rounded-md border border-zinc-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* 硬约束区域 */}
      <div className="mb-4 rounded-md border border-zinc-200 bg-white">
        <button
          onClick={() => setIsHardConstraintsOpen(!isHardConstraintsOpen)}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <span>硬约束区域</span>
          <span className="text-zinc-400">{isHardConstraintsOpen ? '▼' : '▶'}</span>
        </button>
        {isHardConstraintsOpen && (
          <div className="border-t border-zinc-200 p-3">
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                锚定文本 (JSON 格式)
              </label>
              <textarea
                value={anchorsJson}
                onChange={(e) => onAnchorsJsonChange(e.target.value)}
                placeholder='[{"text":"那句台词","speaker":"李奔","position":"开头"}]'
                rows={3}
                disabled={isGenerating}
                className="w-full rounded-md border border-zinc-300 p-2 text-xs font-mono focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                禁止规则 (每行一条)
              </label>
              <textarea
                value={forbiddenRules}
                onChange={(e) => onForbiddenRulesChange(e.target.value)}
                placeholder={'禁止出现XXX\n禁止使用YYY\n不允许ZZZ'}
                rows={3}
                disabled={isGenerating}
                className="w-full rounded-md border border-zinc-300 p-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* 审核元信息 */}
      <div className="mb-4 rounded-md border border-zinc-200 bg-white">
        <button
          onClick={() => setIsMetaInfoOpen(!isMetaInfoOpen)}
          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <span>审核元信息</span>
          <span className="text-zinc-400">{isMetaInfoOpen ? '▼' : '▶'}</span>
        </button>
        {isMetaInfoOpen && (
          <div className="border-t border-zinc-200 p-3">
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-zinc-600">小说背景</label>
              <input
                type="text"
                value={background}
                onChange={(e) => onBackgroundChange(e.target.value)}
                placeholder="简要描述小说世界观或背景..."
                disabled={isGenerating}
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-zinc-600">当前章节序号</label>
              <input
                type="text"
                value={chapterNo}
                onChange={(e) => onChapterNoChange(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="例如：158"
                disabled={isGenerating}
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">近3章爽感类型</label>
              <input
                type="text"
                value={last3ShuangTypes}
                onChange={(e) => onLast3ShuangTypesChange(e.target.value)}
                placeholder="例如：装逼打脸、扮猪吃虎、神豪文..."
                disabled={isGenerating}
                className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* 批量生成区域 */}
      <div className="mb-4 rounded-md border border-zinc-200 bg-white p-3">
        <h3 className="mb-3 text-sm font-medium text-zinc-700">批量生成</h3>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-zinc-600">起始章节</label>
            <input
              type="number"
              value={batchStartChapter}
              onChange={(e) => onBatchStartChapterChange(e.target.value)}
              placeholder="1"
              className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-600">结束章节</label>
            <input
              type="number"
              value={batchEndChapter}
              onChange={(e) => onBatchEndChapterChange(e.target.value)}
              placeholder="10"
              className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm"
            />
          </div>
        </div>

        {/* 批量生成进度 */}
        {batchStatus.status !== 'idle' && (
          <div className="mb-3 rounded bg-zinc-50 p-2">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-zinc-600">
                正在生成：第{batchStatus.currentChapter}章 - 步骤{batchStatus.currentStep}/5
              </span>
              <span className="text-zinc-600">
                {batchStatus.completedChapters}/{batchStatus.totalChapters}章
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-zinc-200">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${getBatchProgress()}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onStartBatch}
            disabled={batchStatus.status === 'running'}
            className="flex-1 rounded bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {batchStatus.status === 'running' ? '生成中...' : '开始批量生成'}
          </button>
          <button
            onClick={onPauseBatch}
            className="rounded bg-yellow-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-yellow-600"
          >
            {batchStatus.status === 'paused' ? '继续' : '暂停'}
          </button>
          <button
            onClick={onStopBatch}
            className="rounded bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
          >
            停止
          </button>
        </div>

        {/* 批量报告 */}
        {showBatchReport && batchStatus.results.length > 0 && (
          <BatchReport
            batchStatus={batchStatus}
            formatDuration={formatDuration}
            onClose={onCloseBatchReport}
          />
        )}
      </div>

      {/* ActionBar: 执行按钮 + 自动保存状态 */}
      <ActionBar
        isGenerating={isGenerating}
        currentGeneratingStep={currentGeneratingStep}
        onExecuteCurrentStep={onExecuteCurrentStep}
        onFullFlow={onFullFlow}
        onRegenerate={onRegenerate}
        autoSaveStatus={autoSaveStatus}
        onRetrySave={onRetrySave}
      />
    </div>
  );
}
