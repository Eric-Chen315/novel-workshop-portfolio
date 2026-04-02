'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useWizardState } from './hooks/useWizardState';
import Step1_ProjectBasics from './steps/Step1_ProjectBasics';
import Step2_WorldBuilding from './steps/Step2_WorldBuilding';
import Step3_Characters from './steps/Step3_Characters';
import Step4_MasterOutline from './steps/Step4_MasterOutline';
import Step5_VolumeOutline from './steps/Step5_VolumeOutline';
import Step6_FirstBatch from './steps/Step6_FirstBatch';

// ─── 进度条配置 ───────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: '基础设定' },
  { num: 2, label: '世界观' },
  { num: 3, label: '人物' },
  { num: 4, label: '故事骨架' },
  { num: 5, label: '分卷大纲' },
  { num: 6, label: '首批生成' },
] as const;

// ─── 进度条组件 ───────────────────────────────────────────────────────────────

function StepBar({
  current,
  onGoToStep,
}: {
  current: number;
  onGoToStep: (step: number) => void;
}) {
  return (
    <nav className="mb-10">
      <ol className="flex items-center">
        {STEPS.map((step, idx) => {
          const isCompleted = step.num < current;
          const isCurrent = step.num === current;

          return (
            <li key={step.num} className="flex items-center flex-1 min-w-0">
              {/* 步骤圆点 + 标签 */}
              <div
                className={`flex flex-col items-center ${isCompleted ? 'cursor-pointer group' : ''}`}
                onClick={isCompleted ? () => onGoToStep(step.num) : undefined}
                title={isCompleted ? `返回${step.label}` : undefined}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-800'
                      : isCompleted
                      ? 'bg-blue-500 text-white group-hover:bg-blue-400'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {isCompleted ? '✓' : step.num}
                </div>
                <span
                  className={`mt-1.5 text-xs whitespace-nowrap ${
                    isCurrent
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : isCompleted
                      ? 'text-blue-500 dark:text-blue-400 group-hover:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {/* 连接线 */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 mb-5 transition-colors ${
                    step.num < current
                      ? 'bg-blue-400 dark:bg-blue-700'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── 主向导组件 ───────────────────────────────────────────────────────────────

export default function WizardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const wizard = useWizardState();
  const { state, isHydrated } = wizard;

  const [isInitializing, setIsInitializing] = useState(false);
  const didInitRef = useRef(false);

  // ── URL 参数处理：?projectId=xxx&step=4 ─────────────────────────────────────
  useEffect(() => {
    if (!isHydrated || didInitRef.current) return;

    const urlProjectId = searchParams.get('projectId');
    const urlStep = Number(searchParams.get('step')) || undefined;

    if (!urlProjectId) return;

    didInitRef.current = true;

    // 同一个项目已在状态中，直接跳步
    if (state.projectId === urlProjectId) {
      if (urlStep && urlStep !== state.currentStep) {
        wizard.goToStep(urlStep as 1 | 2 | 3 | 4 | 5 | 6);
      }
      return;
    }

    // 从服务端初始化
    setIsInitializing(true);
    wizard.initFromProject(urlProjectId, urlStep).finally(() => {
      setIsInitializing(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

  // ── 完成向导 ────────────────────────────────────────────────────────────────
  function handleFinish() {
    const id = state.projectId;
    wizard.clearDraft();
    router.push(id ? `/projects/${id}/workspace` : '/projects');
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (!isHydrated || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="text-sm text-gray-400 dark:text-gray-500">
          {isInitializing ? '正在加载项目数据…' : '加载中…'}
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 顶部返回链接 */}
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          ← 返回项目列表
        </Link>
      </div>

      <StepBar
        current={state.currentStep}
        onGoToStep={(n) => wizard.goToStep(n as 1 | 2 | 3 | 4 | 5 | 6)}
      />

      {state.currentStep === 1 && (
        <Step1_ProjectBasics
          data={state.step1}
          projectId={state.projectId}
          onChange={wizard.setStep1}
          onCompleteStep1={wizard.completeStep1}
        />
      )}

      {state.currentStep === 2 && state.projectId && (
        <Step2_WorldBuilding
          data={state.step2}
          projectId={state.projectId}
          step1={state.step1}
          onChange={wizard.setStep2}
          onAddItem={wizard.addWorldItem}
          onUpdateItem={wizard.updateWorldItem}
          onRemoveItem={wizard.removeWorldItem}
          onNext={wizard.goNext}
          onPrev={wizard.goPrev}
        />
      )}

      {state.currentStep === 3 && state.projectId && (
        <Step3_Characters
          data={state.step3}
          projectId={state.projectId}
          step1={state.step1}
          onAddCharacter={wizard.addCharacter}
          onUpdateCharacter={wizard.updateCharacter}
          onRemoveCharacter={wizard.removeCharacter}
          onFinish={wizard.goNext}
          onPrev={wizard.goPrev}
        />
      )}

      {state.currentStep === 4 && state.projectId && (
        <Step4_MasterOutline
          projectId={state.projectId}
          step1={state.step1}
          step2={state.step2}
          step3={state.step3}
          data={state.step4}
          onChange={wizard.setStep4}
          onUpdateVolume={wizard.updateVolume}
          onNext={wizard.goNext}
          onPrev={wizard.goPrev}
          onFinish={handleFinish}
        />
      )}

      {state.currentStep === 5 && state.projectId && (
        <Step5_VolumeOutline
          projectId={state.projectId}
          step4={state.step4}
          onNext={wizard.goNext}
          onPrev={wizard.goPrev}
        />
      )}

      {state.currentStep === 6 && state.projectId && (
        <Step6_FirstBatch
          projectId={state.projectId}
          onPrev={wizard.goPrev}
          onFinish={handleFinish}
        />
      )}

      {/* 安全兜底：步骤不匹配（projectId 丢失） */}
      {[2, 3, 4, 5, 6].includes(state.currentStep) && !state.projectId && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            会话数据异常，请从第一步重新开始
          </p>
          <button
            onClick={() => wizard.clearDraft()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            重新开始
          </button>
        </div>
      )}
    </div>
  );
}
