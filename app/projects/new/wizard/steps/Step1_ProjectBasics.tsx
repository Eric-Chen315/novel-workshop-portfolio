'use client';

import { useState } from 'react';
import type { WizardStep1 } from '../hooks/useWizardState';
import type { ProjectGenre } from '@/lib/types/project';

const GENRES: { value: ProjectGenre; label: string }[] = [
  { value: '都市', label: '都市' },
  { value: '玄幻', label: '玄幻' },
  { value: '科幻', label: '科幻' },
  { value: '言情', label: '言情' },
  { value: '悬疑', label: '悬疑' },
  { value: '历史', label: '历史' },
  { value: '游戏', label: '游戏' },
  { value: '末世', label: '末世' },
  { value: '其他', label: '其他' },
];

const TARGET_WORDS = [
  { value: 500000, label: '50万字' },
  { value: 1000000, label: '100万字' },
  { value: 1500000, label: '150万字' },
  { value: 2000000, label: '200万字+' },
];

const STYLE_TAGS = ['轻松搞笑', '热血', '虐心', '爽文', '慢热', '系统流', '无敌流', '种田流'];

const SYNOPSIS_MAX = 300;

interface Props {
  data: WizardStep1;
  projectId: string | null;
  onChange: (data: Partial<WizardStep1>) => void;
  onCompleteStep1: (projectId: string) => void;
}

export default function Step1_ProjectBasics({ data, projectId, onChange, onCompleteStep1 }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isValid =
    data.title.trim().length > 0 &&
    data.genre !== '' &&
    data.synopsis.trim().length > 0;

  function toggleStyleTag(tag: string) {
    const tags = data.styleTags.includes(tag)
      ? data.styleTags.filter((t) => t !== tag)
      : [...data.styleTags, tag];
    onChange({ styleTags: tags });
  }

  async function handleNext() {
    if (!isValid || isSubmitting) return;

    // 项目已在本次向导中创建过，直接推进
    if (projectId) {
      onCompleteStep1(projectId);
      return;
    }

    setIsSubmitting(true);
    setError('');

    const styleDescription =
      data.styleTags.join('、') ||
      data.coreAbility.slice(0, 100) ||
      '通用网文风格';

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title.trim(),
          genre: data.genre,
          synopsis: data.synopsis.trim().slice(0, SYNOPSIS_MAX),
          styleDescription,
          targetWords: {
            total: data.targetWords,
            perChapter: 2500,
          },
          tags: data.styleTags,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || '创建项目失败');
      }

      const json = (await res.json()) as { data: { id: string } };
      onCompleteStep1(json.data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">基础设定</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          填写新小说的基本信息，这些数据将贯穿后续所有 AI 生成环节
        </p>
      </div>

      {/* 书名 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          书名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="请输入书名"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          类型 <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => onChange({ genre: g.value })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                data.genre === g.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* 故事简介 */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            核心梗 / 故事简介 <span className="text-red-500">*</span>
          </label>
          <span
            className={`text-xs ${
              data.synopsis.length > SYNOPSIS_MAX ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            {data.synopsis.length}/{SYNOPSIS_MAX}
          </span>
        </div>
        <textarea
          value={data.synopsis}
          onChange={(e) => onChange({ synopsis: e.target.value })}
          placeholder="用 2-3 句话概括故事核心，例如：落魄少年意外获得系统，末世中逆袭称神……"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* 目标字数 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          目标字数
        </label>
        <select
          value={data.targetWords}
          onChange={(e) => onChange({ targetWords: Number(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TARGET_WORDS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* 风格标签 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          风格标签（可多选）
        </label>
        <div className="flex flex-wrap gap-2">
          {STYLE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleStyleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                data.styleTags.includes(tag)
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 金手指 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          金手指 / 核心设定
        </label>
        <textarea
          value={data.coreAbility}
          onChange={(e) => onChange({ coreAbility: e.target.value })}
          placeholder="例如：主角能看到他人头顶的属性面板，面板显示对方的真实想法……"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {/* 已创建项目提示 */}
      {projectId && (
        <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 px-4 py-2.5 text-sm text-green-700 dark:text-green-400">
          项目已创建（ID: {projectId.slice(0, 8)}…），点击下一步继续完善设定
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleNext}
          disabled={!isValid || isSubmitting}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white disabled:text-gray-500 rounded-md font-medium transition-colors"
        >
          {isSubmitting ? '创建中…' : '下一步 →'}
        </button>
      </div>
    </div>
  );
}
