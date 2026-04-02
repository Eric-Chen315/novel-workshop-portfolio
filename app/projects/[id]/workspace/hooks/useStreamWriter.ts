'use client';

import { useState, useRef, useCallback } from 'react';
import type { TabsContent } from './useChapterState';

// ─── Shared utility ───────────────────────────────────────────────────────────

export interface ChapterDetail {
  title: string;
  exists: boolean;
  summary: string;
  rawContent: string;
  corePurpose?: string;
  plotPoints?: string[];
  keyCharacters?: string[];
  emotionalArc?: string;
  mustInclude: string[];
  connectionToPrev?: string;
  connectionToNext: string;
  suggestedWordCount?: number;
  wordCountGuide?: string;
}

function normalizeLines(items?: string[]): string[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => item.trim()).filter(Boolean);
}

export function formatChapterDirection(detail: ChapterDetail, nextChapterTitle?: string): string {
  if (!detail.exists) return '';

  const lines: string[] = [];
  const normalizedPlotPoints = normalizeLines(detail.plotPoints);
  const normalizedMustInclude = normalizeLines(detail.mustInclude);
  const normalizedKeyCharacters = normalizeLines(detail.keyCharacters);

  const chapterTitle = detail.title?.trim() || '未命名章节';
  lines.push(chapterTitle);

  if (detail.summary?.trim()) lines.push(`【概要】${detail.summary.trim()}`);
  if (detail.corePurpose?.trim()) lines.push(`【核心目的】${detail.corePurpose.trim()}`);

  if (normalizedPlotPoints.length > 0) {
    lines.push('【关键情节点】');
    normalizedPlotPoints.forEach((point) => lines.push(`- ${point}`));
  }

  if (normalizedMustInclude.length > 0) {
    lines.push('【必须包含】');
    normalizedMustInclude.forEach((item) => lines.push(`- ${item}`));
  }

  if (normalizedKeyCharacters.length > 0) {
    lines.push(`【关键角色】${normalizedKeyCharacters.join('、')}`);
  }

  if (detail.emotionalArc?.trim()) {
    lines.push(`【情感弧线】${detail.emotionalArc.trim()}`);
  }

  const wordCountText =
    typeof detail.suggestedWordCount === 'number' && Number.isFinite(detail.suggestedWordCount)
      ? `${detail.suggestedWordCount}`
      : detail.wordCountGuide?.trim() || '';
  if (wordCountText) {
    lines.push(`【建议字数】${wordCountText}`);
  }

  const rawContent = detail.rawContent?.trim();
  if (rawContent) {
    lines.push('【细纲原文】');
    lines.push(rawContent);
  }

  if (detail.connectionToPrev?.trim()) {
    lines.push('【与上一章的衔接】');
    lines.push(detail.connectionToPrev.trim());
  }

  if (detail.connectionToNext?.trim()) {
    lines.push(`【下一章衔接】${detail.connectionToNext.trim()}`);
  }

  if (nextChapterTitle?.trim()) {
    lines.push(`【下一章信息（仅用于创作本章章末钩子，不要提前展开下一章内容）】`);
    lines.push(`下一章标题：${nextChapterTitle.trim()}`);
  }

  return lines.filter(Boolean).join('\n');
}

export async function fetchChapterDetail(
  projectId: string,
  chapterNum: number,
): Promise<ChapterDetail> {
  try {
    const response = await fetch(`/api/projects/${projectId}/outline/${chapterNum}`);
    if (!response.ok) throw new Error('Failed to fetch outline');
    const data = await response.json();
    return {
      title: data.title || `第${chapterNum}章`,
      exists: data.exists || false,
      summary: data.summary || '',
      rawContent: data.rawContent || '',
      corePurpose: data.corePurpose || '',
      plotPoints: data.plotPoints || [],
      keyCharacters: data.keyCharacters || [],
      emotionalArc: data.emotionalArc || '',
      mustInclude: data.mustInclude || [],
      connectionToPrev: data.connectionToPrev || '',
      connectionToNext: data.connectionToNext || '',
      suggestedWordCount: data.suggestedWordCount,
      wordCountGuide: data.wordCountGuide || '',
    };
  } catch {
    return {
      title: `第${chapterNum}章`,
      exists: false,
      summary: '',
      rawContent: '',
      corePurpose: '',
      plotPoints: [],
      keyCharacters: [],
      emotionalArc: '',
      mustInclude: [],
      connectionToPrev: '',
      connectionToNext: '',
      suggestedWordCount: undefined,
      wordCountGuide: '',
    };
  }
}

/** @deprecated 使用 fetchChapterDetail 替代 */
export async function fetchChapterTitle(
  projectId: string,
  chapterNum: number,
): Promise<{ title: string; exists: boolean }> {
  const detail = await fetchChapterDetail(projectId, chapterNum);
  return { title: detail.title, exists: detail.exists };
}

// ─── Hook deps ────────────────────────────────────────────────────────────────

interface UseStreamWriterDeps {
  tabs: TabsContent;
  setTabs: React.Dispatch<React.SetStateAction<TabsContent>>;
  autoSaveChapter: (
    content: string,
    chapterNoStr: string,
    forceChapterNum?: number,
    forceTitle?: string,
  ) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStreamWriter(projectId: string, deps: UseStreamWriterDeps) {
  const { setTabs, autoSaveChapter } = deps;

  // ── Input state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<string>('');
  const [extra, setExtra] = useState<string>('');
  const [anchorsJson, setAnchorsJson] = useState<string>('');
  const [forbiddenRules, setForbiddenRules] = useState<string>('');
  const [background, setBackground] = useState<string>('');
  const [chapterNo, setChapterNo] = useState<string>('');
  const [last3ShuangTypes, setLast3ShuangTypes] = useState<string>('');

  // ── Output / UI state ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentGeneratingStep, setCurrentGeneratingStep] = useState<number | null>(null);

  const outputRef = useRef<HTMLDivElement | null>(null);

  const autoFillDirectionForChapter = useCallback(
    async (chapterNoValue: string) => {
      const normalizedChapterNo = chapterNoValue.trim();
      if (!normalizedChapterNo) {
        setDirection('');
        return '';
      }

      const chapterNum = parseInt(normalizedChapterNo, 10);
      if (Number.isNaN(chapterNum)) {
        setDirection('');
        return '';
      }

      try {
        const detail = await fetchChapterDetail(projectId, chapterNum);
        if (!detail.exists) {
          setDirection('');
          return '';
        }

        const nextDetail = await fetchChapterDetail(projectId, chapterNum + 1);
        const nextTitle = nextDetail.exists ? nextDetail.title : '';
        const formattedDirection = formatChapterDirection(detail, nextTitle);
        setDirection(formattedDirection);
        return formattedDirection;
      } catch (error) {
        console.error('自动加载章节细纲失败:', error);
        setDirection('');
        return '';
      }
    },
    [projectId],
  );

  // ── Request builder ────────────────────────────────────────────────────────

  function buildRequestBody(
    currentStep: number,
    stepOutputs: Record<number, string>,
    batchDirection?: string,
    batchChapterNum?: number,
    batchRawContent?: string,
  ): Record<string, string> {
    const effectiveDirection = batchDirection !== undefined ? batchDirection : direction;
    const effectiveChapterNo =
      batchChapterNum !== undefined ? batchChapterNum.toString() : chapterNo;

    const base = {
      step: currentStep.toString(),
      direction: effectiveDirection,
      extra,
      background,
      chapterNo: effectiveChapterNo,
      last3ShuangTypes,
      anchorsJson,
      forbiddenRules,
      projectId,
      outlineContent: batchRawContent || effectiveDirection,
    };

    // 诊断日志：追踪 direction 和 outlineContent
    console.log(`\n=== 前端 Step ${currentStep} 请求体构建诊断 ===`);
    console.log('batchDirection 参数:', batchDirection ? `存在(${batchDirection.length}字符)` : 'undefined');
    console.log('direction 状态变量:', direction ? `存在(${direction.length}字符)` : '空字符串');
    console.log('effectiveDirection:', effectiveDirection ? `存在(${effectiveDirection.length}字符)` : '空字符串');
    console.log('batchRawContent 参数:', batchRawContent ? `存在(${batchRawContent.length}字符)` : 'undefined');
    console.log('最终 direction 字段:', base.direction?.substring(0, 100) || '空');
    console.log('最终 outlineContent 字段:', base.outlineContent?.substring(0, 100) || '空');

    if (currentStep === 1) return { ...base, tab1: '', tab2: '', tab3: '', tab4: '' };
    if (currentStep === 2) return { ...base, tab1: stepOutputs[1] || '', tab2: '', tab3: '', tab4: '' };
    if (currentStep === 3) return { ...base, tab1: stepOutputs[1] || '', tab2: stepOutputs[2] || '', tab3: '', tab4: '' };
    if (currentStep === 4) return { ...base, tab1: '', tab2: '', tab3: stepOutputs[3] || '', tab4: '' };
    if (currentStep === 5) return { ...base, tab1: '', tab2: '', tab3: stepOutputs[3] || '', tab4: stepOutputs[4] || '' };
    return { ...base, tab1: '', tab2: '', tab3: '', tab4: '' };
  }

  // ── Core stream executor ───────────────────────────────────────────────────

  const executeStep = useCallback(
    async (
      currentStep: number,
      stepOutputs: Record<number, string> = {},
      skipDirectionValidation = false,
      batchDirection?: string,
      forceChapterNum?: number,
      forceChapterTitle?: string,
      forceRawContent?: string,
    ): Promise<{ success: boolean; output: string }> => {
      const effectiveDirection = batchDirection !== undefined ? batchDirection : direction;
      if (!skipDirectionValidation && currentStep === 1 && !effectiveDirection.trim()) {
        alert('步骤1需要填写章节方向');
        return { success: false, output: '' };
      }

      setIsGenerating(true);
      setCurrentGeneratingStep(currentStep);

      const tabKey = `tab${currentStep}` as keyof TabsContent;
      setTabs(prev => ({ ...prev, [tabKey]: '' }));
      setActiveTab(currentStep);

      let fullText = '';

      try {
        const response = await fetch('/api/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            buildRequestBody(currentStep, stepOutputs, batchDirection, forceChapterNum, forceRawContent),
          ),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(error.error || `HTTP ${response.status}`);
        }
        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setTabs(prev => ({ ...prev, [tabKey]: fullText }));
          if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
          }
        }

        setTabs(prev => ({ ...prev, [tabKey]: fullText }));

        if (currentStep === 1 && fullText.trim().length < 100) {
          console.error('[Step1] 生成内容为空或过短，可能是 API 返回异常。内容长度:', fullText.length);
          alert('Step1 生成内容为空或过短，已中断后续流程。请重试 Step1。');
          return { success: false, output: fullText };
        }

        // 步骤5完成后自动保存并更新预告
        if (currentStep === 5) {
          setTimeout(async () => {
            let finalTitle = forceChapterTitle;
            let chNum = forceChapterNum;
            
            // 如果没有强制指定标题和章节号,尝试从 chapterNo 输入框获取
            if (!chNum) {
              const currentChapterNo = chapterNo.trim();
              if (currentChapterNo) {
                chNum = parseInt(currentChapterNo, 10);
              }
            }
            
            // 如果没有强制指定标题,尝试从 outline 获取
            if (!finalTitle && chNum && !isNaN(chNum)) {
              const { title } = await fetchChapterTitle(projectId, chNum);
              finalTitle = title;
            }
            
            // 如果还是没有标题,使用默认格式
            if (!finalTitle && chNum) {
              finalTitle = `第${chNum}章`;
            }
            
            // 执行保存
            await autoSaveChapter(fullText, chapterNo, chNum, finalTitle);
            
            // 自动更新下集预告
            if (chNum) {
              try {
                await fetch(`/api/projects/${projectId}/chapters/${chNum}/preview`, {
                  method: 'POST',
                });
                console.log(`第${chNum}章预告已自动更新`);
              } catch (error) {
                console.error('自动更新预告失败:', error);
              }
            }
          }, 500);
        }

        return { success: true, output: fullText };
      } catch (error) {
        console.error('Generation error:', error);
        alert(`生成失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { success: false, output: '' };
      } finally {
        setIsGenerating(false);
        setCurrentGeneratingStep(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [direction, extra, background, chapterNo, last3ShuangTypes, anchorsJson, forbiddenRules, projectId, setTabs, autoSaveChapter],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleExecuteCurrentStep = async () => {
    await executeStep(step);
  };

  /**
   * onStart: 可选回调，在全流程开始前执行（如重置 autoSaveStatus）
   */
  const handleFullFlow = async (onStart?: () => void) => {
    onStart?.();
    
    console.log('\n========== handleFullFlow 开始 ==========');
    console.log('初始 direction 状态变量:', direction ? `存在(${direction.length}字符)` : '空字符串');
    console.log('初始 chapterNo:', chapterNo);
    
    // 自动加载细纲：如果用户未填写章节方向，且章节号有效，则从 outline.json 读取
    let autoLoadedDirection: string | undefined;
    if (!direction.trim() && chapterNo.trim()) {
      try {
        autoLoadedDirection = await autoFillDirectionForChapter(chapterNo);
        if (autoLoadedDirection) {
          console.log(`✓ 已自动加载第${chapterNo.trim()}章细纲，长度: ${autoLoadedDirection.length}字符`);
        }
      } catch (error) {
        console.error('自动加载细纲失败:', error);
      }
    }
    
    // 检查是否有有效的章节方向（用户填写的或自动加载的）
    const effectiveDirection = autoLoadedDirection || direction;
    console.log('effectiveDirection:', effectiveDirection ? `存在(${effectiveDirection.length}字符)` : '空字符串');
    
    if (!effectiveDirection.trim()) {
      alert('请填写章节方向或确保章节号对应的细纲存在');
      return;
    }
    
    // 解析章节号，用于传递给 executeStep
    const currentChapterNum = chapterNo.trim() ? parseInt(chapterNo.trim(), 10) : undefined;
    
    const stepOutputs: Record<number, string> = {};
    for (let i = 1; i <= 5; i++) {
      console.log(`\n---------- 准备执行 Step ${i} ----------`);
      console.log(`Step ${i} 调用前 direction 状态变量:`, direction ? `存在(${direction.length}字符)` : '空字符串');
      
      setStep(i);
      // 所有步骤都传递细纲内容（优先使用自动加载的，否则使用状态变量）
      const batchDirectionParam = autoLoadedDirection || direction;
      console.log(`Step ${i} 传递的 batchDirection 参数:`, batchDirectionParam ? `存在(${batchDirectionParam.length}字符)` : 'undefined');
      
      const result = await executeStep(
        i, 
        stepOutputs, 
        true, // 跳过内部的空值校验，因为我们已经在上面检查过了
        batchDirectionParam,
        currentChapterNum, // 传递章节号，确保步骤5能正确更新预告
        undefined, // forceChapterTitle
        undefined  // forceRawContent
      );
      
      console.log(`Step ${i} 执行结果:`, result.success ? '成功' : '失败');
      if (!result.success) break;
      stepOutputs[i] = result.output;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('========== handleFullFlow 结束 ==========\n');
  };

  const handleRegenerate = async () => {
    await executeStep(activeTab);
  };

  return {
    // Input state
    step, setStep,
    direction, setDirection,
    extra, setExtra,
    anchorsJson, setAnchorsJson,
    forbiddenRules, setForbiddenRules,
    background, setBackground,
    chapterNo, setChapterNo,
    last3ShuangTypes, setLast3ShuangTypes,
    // Output / UI state
    activeTab, setActiveTab,
    isGenerating,
    currentGeneratingStep,
    outputRef,
    autoFillDirectionForChapter,
    // Functions
    executeStep,
    handleExecuteCurrentStep,
    handleFullFlow,
    handleRegenerate,
  };
}
