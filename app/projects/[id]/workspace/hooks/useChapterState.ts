'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TabsContent {
  tab1: string;
  tab2: string;
  tab3: string;
  tab4: string;
  tab5: string;
}

export interface AutoSaveStatus {
  status: 'idle' | 'saving' | 'success' | 'error';
  message: string;
  chapterNum?: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChapterState(projectId: string) {
  const [tabs, setTabs] = useState<TabsContent>({
    tab1: '', tab2: '', tab3: '', tab4: '', tab5: '',
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    status: 'idle',
    message: '',
  });

  function extractChapterTitle(content: string, defaultChapterNum: number): string {
    const match = content.match(/^第(\d+)章\s+(.+)$/m);
    if (match) return `第${match[1]}章 ${match[2]}`;
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.match(/^第.+章/)) return firstLine;
    return `第${defaultChapterNum}章`;
  }

  /**
   * 自动保存章节。
   * @param chapterNoStr - 当前 chapterNo state 的字符串值，用于未传入 forceChapterNum 时解析
   */
  const autoSaveChapter = async (
    content: string,
    chapterNoStr: string,
    forceChapterNum?: number,
    forceTitle?: string,
  ) => {
    let num: number;

    if (forceChapterNum !== undefined) {
      num = forceChapterNum;
    } else {
      const trimmed = chapterNoStr.trim();
      if (!trimmed) {
        setAutoSaveStatus({ status: 'idle', message: '未填写章节序号，跳过自动保存' });
        return;
      }
      num = parseInt(trimmed, 10);
      if (isNaN(num)) {
        setAutoSaveStatus({ status: 'error', message: '章节序号格式不正确' });
        return;
      }
    }

    let title: string;
    if (forceTitle && forceTitle.trim() && forceTitle !== `第${num}章`) {
      title = forceTitle;
    } else {
      title = extractChapterTitle(content, num);
      if (title === `第${num}章` && content) {
        const firstLine = content.split('\n')[0].trim();
        const m = firstLine.match(/^第(\d+)章[\s:：]+(.+)/);
        if (m && parseInt(m[1], 10) === num) {
          title = `第${m[1]}章 ${m[2].trim()}`;
        }
      }
    }

    setAutoSaveStatus({ status: 'saving', message: '正在自动保存...', chapterNum: num });

    try {
      const response = await fetch(`/api/projects/${projectId}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterNum: num, title, content }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setAutoSaveStatus({
        status: 'success',
        message: `✅ 已自动保存到章节管理（第${result.chapterNum}章）`,
        chapterNum: result.chapterNum,
      });
    } catch (error) {
      console.error('自动保存失败:', error);
      setAutoSaveStatus({
        status: 'error',
        message: `❌ 自动保存失败：${error instanceof Error ? error.message : '未知错误'}`,
        chapterNum: num,
      });
    }
  };

  return {
    tabs,
    setTabs,
    autoSaveStatus,
    setAutoSaveStatus,
    autoSaveChapter,
  };
}
