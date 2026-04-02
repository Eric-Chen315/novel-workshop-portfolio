'use client';

import type { AutoSaveStatus } from '../hooks/useChapterState';

interface Props {
  isGenerating: boolean;
  currentGeneratingStep: number | null;
  onExecuteCurrentStep: () => void;
  onFullFlow: () => void;
  onRegenerate: () => void;
  autoSaveStatus: AutoSaveStatus;
  onRetrySave: () => void;
}

export default function ActionBar({
  isGenerating,
  currentGeneratingStep,
  onExecuteCurrentStep,
  onFullFlow,
  onRegenerate,
  autoSaveStatus,
  onRetrySave,
}: Props) {
  return (
    <>
      {/* 操作按钮 */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={onExecuteCurrentStep}
          disabled={isGenerating}
          className="flex-1 rounded bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating
            ? `生成中... (步骤${currentGeneratingStep})`
            : '执行当前步骤'}
        </button>
        <button
          onClick={onFullFlow}
          disabled={isGenerating}
          className="flex-1 rounded bg-green-500 px-4 py-2 font-medium text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? '生成中...' : '一键全流程'}
        </button>
        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          className="rounded bg-zinc-500 px-4 py-2 font-medium text-white hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          重新生成
        </button>
      </div>

      {/* 自动保存状态 */}
      {autoSaveStatus.message && (
        <div
          className={`mb-4 rounded p-2 text-sm ${
            autoSaveStatus.status === 'success'
              ? 'bg-green-50 text-green-700'
              : autoSaveStatus.status === 'error'
              ? 'bg-red-50 text-red-700'
              : autoSaveStatus.status === 'saving'
              ? 'bg-blue-50 text-blue-700'
              : 'bg-zinc-50 text-zinc-700'
          }`}
        >
          {autoSaveStatus.status === 'error' && (
            <button onClick={onRetrySave} className="ml-2 underline hover:text-red-800">
              重试
            </button>
          )}
          {autoSaveStatus.message}
        </div>
      )}
    </>
  );
}
