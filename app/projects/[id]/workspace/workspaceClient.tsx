"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useChapterState } from "./hooks/useChapterState";
import { useStreamWriter } from "./hooks/useStreamWriter";
import { useBatchGeneration } from "./hooks/useBatchGeneration";
import InputPanel from "./components/InputPanel";
import OutputPanel from "./components/OutputPanel";

export default function WorkspaceClient(props: { projectId: string; projectTitle: string }) {
  // ── Hooks ──────────────────────────────────────────────────────────────────
  const chapterState = useChapterState(props.projectId);

  const streamWriter = useStreamWriter(props.projectId, {
    tabs: chapterState.tabs,
    setTabs: chapterState.setTabs,
    autoSaveChapter: chapterState.autoSaveChapter,
  });

  const batchGen = useBatchGeneration({
    projectId: props.projectId,
    executeStep: streamWriter.executeStep,
    setDirection: streamWriter.setDirection,
    setChapterNo: streamWriter.setChapterNo,
    setStep: streamWriter.setStep,
    setTabs: chapterState.setTabs,
  });

  const { chapterNo, autoFillDirectionForChapter } = streamWriter;

  useEffect(() => {
    void autoFillDirectionForChapter(chapterNo);
  }, [chapterNo, autoFillDirectionForChapter]);

  // ── Thin wrappers ──────────────────────────────────────────────────────────

  const handleFullFlow = () =>
    streamWriter.handleFullFlow(() =>
      chapterState.setAutoSaveStatus({ status: 'idle', message: '' })
    );

  const handleRetrySave = async () => {
    if (chapterState.tabs.tab5) {
      await chapterState.autoSaveChapter(
        chapterState.tabs.tab5,
        streamWriter.chapterNo,
      );
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white">
      {/* 顶部面包屑导航 */}
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-900">小说一站式生成工作台·MVP</span>
            <span className="text-zinc-400">{">"}</span>
            <Link href="/projects" className="text-zinc-700 hover:underline">
              作品列表
            </Link>
            <span className="text-zinc-400">{">"}</span>
            <span className="font-semibold text-zinc-900">{props.projectTitle}</span>
            <span className="text-zinc-400">{">"}</span>
            <span className="text-zinc-700">创作工作台</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/projects/${props.projectId}/knowledge`} className="text-zinc-700 hover:underline">
              知识库
            </Link>
            <span className="text-zinc-400">|</span>
            <Link href={`/projects/${props.projectId}/chapters`} className="text-zinc-700 hover:underline">
              章节管理
            </Link>
          </div>
        </div>
      </div>

      {/* 主内容区 - 左右两栏 */}
      <div className="mx-auto flex max-w-6xl gap-0">
        <InputPanel
          step={streamWriter.step}
          onStepChange={streamWriter.setStep}
          direction={streamWriter.direction}
          onDirectionChange={streamWriter.setDirection}
          extra={streamWriter.extra}
          onExtraChange={streamWriter.setExtra}
          anchorsJson={streamWriter.anchorsJson}
          onAnchorsJsonChange={streamWriter.setAnchorsJson}
          forbiddenRules={streamWriter.forbiddenRules}
          onForbiddenRulesChange={streamWriter.setForbiddenRules}
          background={streamWriter.background}
          onBackgroundChange={streamWriter.setBackground}
          chapterNo={chapterNo}
          onChapterNoChange={streamWriter.setChapterNo}
          last3ShuangTypes={streamWriter.last3ShuangTypes}
          onLast3ShuangTypesChange={streamWriter.setLast3ShuangTypes}
          isGenerating={streamWriter.isGenerating}
          currentGeneratingStep={streamWriter.currentGeneratingStep}
          batchStartChapter={batchGen.batchStartChapter}
          onBatchStartChapterChange={batchGen.setBatchStartChapter}
          batchEndChapter={batchGen.batchEndChapter}
          onBatchEndChapterChange={batchGen.setBatchEndChapter}
          batchStatus={batchGen.batchStatus}
          showBatchReport={batchGen.showBatchReport}
          onCloseBatchReport={() => batchGen.setShowBatchReport(false)}
          onStartBatch={batchGen.handleStartBatchGeneration}
          onPauseBatch={batchGen.handlePauseBatch}
          onStopBatch={batchGen.handleStopBatch}
          getBatchProgress={batchGen.getBatchProgress}
          formatDuration={batchGen.formatDuration}
          onExecuteCurrentStep={streamWriter.handleExecuteCurrentStep}
          onFullFlow={handleFullFlow}
          onRegenerate={streamWriter.handleRegenerate}
          autoSaveStatus={chapterState.autoSaveStatus}
          onRetrySave={handleRetrySave}
        />

        <OutputPanel
          tabs={chapterState.tabs}
          activeTab={streamWriter.activeTab}
          onActiveTabChange={streamWriter.setActiveTab}
          outputRef={streamWriter.outputRef}
          isGenerating={streamWriter.isGenerating}
        />
      </div>
    </div>
  );
}
