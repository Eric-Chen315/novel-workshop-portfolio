'use client';

import { useState, useRef, useEffect } from 'react';
import type { TabsContent } from './useChapterState';
import {
  fetchChapterDetail,
  formatChapterDirection,
  type ChapterDetail,
} from './useStreamWriter';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BatchResultItem {
  chapterNum: number;
  title: string;
  wordCount: number;
  success: boolean;
  error?: string;
  duration: number;
}

export interface BatchStatus {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentChapter: number;
  currentStep: number;
  totalChapters: number;
  completedChapters: number;
  results: BatchResultItem[];
  errorMessage?: string;
  startTime?: number;
  endTime?: number;
}

const DEFAULT_BATCH_STATUS: BatchStatus = {
  status: 'idle',
  currentChapter: 0,
  currentStep: 0,
  totalChapters: 0,
  completedChapters: 0,
  results: [],
};

// ─── Hook deps ────────────────────────────────────────────────────────────────

interface UseBatchGenerationDeps {
  projectId: string;
  executeStep: (
    currentStep: number,
    stepOutputs: Record<number, string>,
    skipDirectionValidation: boolean,
    batchDirection?: string,
    forceChapterNum?: number,
    forceChapterTitle?: string,
    forceRawContent?: string,
  ) => Promise<{ success: boolean; output: string }>;
  setDirection: (d: string) => void;
  setChapterNo: (n: string) => void;
  setStep: (s: number) => void;
  setTabs: React.Dispatch<React.SetStateAction<TabsContent>>;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function getWordCount(text: string): number {
  return text.replace(/\s/g, '').length;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes > 0 ? `${minutes}分${remaining}秒` : `${seconds}秒`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBatchGeneration(deps: UseBatchGenerationDeps) {
  const { projectId, executeStep, setDirection, setChapterNo, setStep, setTabs } = deps;

  const [batchStartChapter, setBatchStartChapter] = useState<string>('');
  const [batchEndChapter, setBatchEndChapter] = useState<string>('');
  const [batchStatus, setBatchStatus] = useState<BatchStatus>(DEFAULT_BATCH_STATUS);
  const [showBatchReport, setShowBatchReport] = useState<boolean>(false);

  const batchCancelledRef = useRef<boolean>(false);
  const batchPausedRef = useRef<boolean>(false);
  const batchDirectionRef = useRef<string>('');
  const batchStatusRef = useRef<BatchStatus>(batchStatus);

  useEffect(() => {
    batchStatusRef.current = batchStatus;
  }, [batchStatus]);

  // ── Internal: generate one chapter ────────────────────────────────────────

  async function generateSingleChapter(
    chapterDetail: ChapterDetail,
    chapterNum: number,
    nextChapterTitle: string,
    previousEnding: string,
    onStepComplete?: (step: number) => void,
  ): Promise<{ success: boolean; wordCount: number; error?: string; finalText: string }> {
    const stepOutputs: Record<number, string> = {};

    setChapterNo(chapterNum.toString());

    let directionText = chapterDetail.exists
      ? formatChapterDirection(chapterDetail, nextChapterTitle)
      : '';

    if (!directionText) {
      const detail = await fetchChapterDetail(projectId, chapterNum);
      directionText = detail.exists ? formatChapterDirection(detail, nextChapterTitle) : '';
    }

    if (previousEnding && previousEnding.trim()) {
      directionText = `【上一章结尾（请自然衔接）】\n${previousEnding}\n\n---\n\n${directionText}`;
    }

    setDirection(directionText);
    batchDirectionRef.current = directionText;

    for (let s = 1; s <= 5; s++) {
      if (batchCancelledRef.current) return { success: false, wordCount: 0, error: '已取消', finalText: '' };

      while (batchPausedRef.current && !batchCancelledRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setStep(s);

      const result = await executeStep(
        s,
        stepOutputs,
        true,
        directionText,
        chapterNum,
        chapterDetail.title,
        chapterDetail.rawContent,
      );
      if (!result.success) return { success: false, wordCount: 0, error: `步骤${s}生成失败`, finalText: '' };

      stepOutputs[s] = result.output;
      onStepComplete?.(s);

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const finalText = stepOutputs[5] || '';
    const wordCount = getWordCount(finalText);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, wordCount, finalText };
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStartBatchGeneration = async () => {
    const startChapter = parseInt(batchStartChapter, 10);
    const endChapter = parseInt(batchEndChapter, 10);

    if (isNaN(startChapter) || isNaN(endChapter)) {
      alert('请输入有效的章节号');
      return;
    }
    if (startChapter > endChapter) {
      alert('起始章节号不能大于结束章节号');
      return;
    }

    batchCancelledRef.current = false;
    batchPausedRef.current = false;
    setShowBatchReport(false);

    const totalChapters = endChapter - startChapter + 1;
    const startTime = Date.now();
    let previousChapterEnding = '';

    setBatchStatus({
      status: 'running',
      currentChapter: startChapter,
      currentStep: 0,
      totalChapters,
      completedChapters: 0,
      results: [],
      startTime,
    });

    setTabs({ tab1: '', tab2: '', tab3: '', tab4: '', tab5: '' });

    for (let i = 0; i < totalChapters; i++) {
      const currentChapterNum = startChapter + i;

      if (batchCancelledRef.current) {
        setBatchStatus(prev => ({ ...prev, status: 'paused' }));
        return;
      }

      while (batchPausedRef.current && !batchCancelledRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setBatchStatus(prev => ({
        ...prev,
        currentChapter: currentChapterNum,
        currentStep: 0,
      }));

      const detail = await fetchChapterDetail(projectId, currentChapterNum);
      if (!detail.exists) {
        console.log(`章节 ${currentChapterNum} 在大纲中不存在，将保留章节方向为空`);
      }

      let nextChapterTitle = '';
      if (i < totalChapters - 1) {
        const nextDetail = await fetchChapterDetail(projectId, currentChapterNum + 1);
        nextChapterTitle = nextDetail.exists ? nextDetail.title : '';
      }

      const chapterStartTime = Date.now();

      const result = await generateSingleChapter(
        detail,
        currentChapterNum,
        nextChapterTitle,
        previousChapterEnding,
        step => {
          setBatchStatus(prev => ({ ...prev, currentStep: step }));
        },
      );

      if (result.success && result.finalText) {
        const text = result.finalText;
        previousChapterEnding = text.length > 800 ? text.slice(-800) : text;
      }

      const duration = Date.now() - chapterStartTime;

      const resultItem: BatchResultItem = {
        chapterNum: currentChapterNum,
        title: detail.exists ? detail.title : `${detail.title} (大纲中未找到)`,
        wordCount: result.wordCount,
        success: result.success,
        error: result.error,
        duration,
      };

      setBatchStatus(prev => ({
        ...prev,
        completedChapters: prev.completedChapters + 1,
        results: [...prev.results, resultItem],
      }));

      if (i === totalChapters - 1) {
        setBatchStatus(prev => ({ ...prev, status: 'completed', endTime: Date.now() }));
        
        // 批量生成完成后，自动更新所有章节的预告（除最后一章）
        console.log('批量生成完成，开始更新下集预告...');
        for (let j = 0; j < totalChapters - 1; j++) {
          const chNum = startChapter + j;
          try {
            await fetch(`/api/projects/${projectId}/chapters/${chNum}/preview`, {
              method: 'POST',
            });
            console.log(`第${chNum}章预告已更新`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 间隔1秒
          } catch (error) {
            console.error(`第${chNum}章预告更新失败:`, error);
          }
        }
        console.log('所有预告更新完成');
      }

      if (i < totalChapters - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  };

  const handlePauseBatch = () => {
    if (batchStatus.status === 'running') {
      batchPausedRef.current = true;
      setBatchStatus(prev => ({ ...prev, status: 'paused' }));
    } else if (batchStatus.status === 'paused') {
      batchPausedRef.current = false;
      setBatchStatus(prev => ({ ...prev, status: 'running' }));
    }
  };

  const handleStopBatch = () => {
    batchCancelledRef.current = true;
    batchPausedRef.current = false;
    setBatchStatus(prev => ({ ...prev, status: 'completed', endTime: Date.now() }));
    setShowBatchReport(true);
  };

  const handleSkipCurrentChapter = () => {
    setBatchStatus(prev => ({ ...prev, currentStep: 0 }));
  };

  const getBatchProgress = (): number => {
    if (batchStatus.totalChapters === 0) return 0;
    return Math.round((batchStatus.completedChapters / batchStatus.totalChapters) * 100);
  };

  return {
    batchStartChapter, setBatchStartChapter,
    batchEndChapter, setBatchEndChapter,
    batchStatus,
    showBatchReport, setShowBatchReport,
    handleStartBatchGeneration,
    handlePauseBatch,
    handleStopBatch,
    handleSkipCurrentChapter,
    getBatchProgress,
    formatDuration,
  };
}
