'use client';

import { useState } from 'react';
import type { TabsContent } from '../hooks/useChapterState';

const TAB_NAMES = ['初稿', '读者反馈', '二稿', '审核报告', '终稿'];

function getWordCount(text: string): number {
  return text.replace(/\s/g, '').length;
}

interface Props {
  tabs: TabsContent;
  activeTab: number;
  onActiveTabChange: (tab: number) => void;
  outputRef: React.RefObject<HTMLDivElement | null>;
  isGenerating: boolean;
}

export default function OutputPanel({
  tabs,
  activeTab,
  onActiveTabChange,
  outputRef,
  isGenerating,
}: Props) {
  const [copyButtonText, setCopyButtonText] = useState('复制内容');

  const currentContent = tabs[`tab${activeTab}` as keyof TabsContent] || '';

  const handleCopyContent = async () => {
    if (!currentContent) return;
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopyButtonText('已复制');
      setTimeout(() => setCopyButtonText('复制内容'), 2000);
    } catch {
      alert('复制失败，请手动复制内容');
    }
  };

  return (
    <div className="w-3/5 bg-white p-4">
      {/* Tab 切换按钮 */}
      <div className="mb-4 flex border-b border-zinc-200">
        {TAB_NAMES.map((name, index) => (
          <button
            key={index + 1}
            onClick={() => onActiveTabChange(index + 1)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === index + 1
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {name}
            <span className="ml-1 text-xs text-zinc-400">
              ({getWordCount(tabs[`tab${index + 1}` as keyof TabsContent] || '').toLocaleString()}字)
            </span>
          </button>
        ))}
      </div>

      {/* 输出内容区域 */}
      <div
        ref={outputRef}
        className="mb-4 h-[500px] overflow-y-auto whitespace-pre-wrap rounded border border-zinc-200 bg-zinc-50 p-4 text-sm leading-relaxed"
      >
        {currentContent || (
          <span className="text-zinc-400">
            {isGenerating ? '正在生成内容...' : '点击"执行当前步骤"或"一键全流程"开始生成'}
          </span>
        )}
      </div>

      {/* 复制按钮 */}
      <button
        onClick={handleCopyContent}
        className="w-full rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
      >
        {copyButtonText}
      </button>
    </div>
  );
}
