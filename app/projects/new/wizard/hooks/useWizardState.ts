'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ProjectGenre } from '@/lib/types/project';

const STORAGE_KEY = 'novel_wizard_draft_v1';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizardStep1 {
  title: string;
  genre: ProjectGenre | '';
  synopsis: string;
  targetWords: number;
  styleTags: string[];
  coreAbility: string;
}

export interface WorldItem {
  id: string;
  name: string;
  description: string;
}

export interface WizardStep2 {
  worldBackground: string;
  powerSystem: string;
  factions: WorldItem[];
  locations: WorldItem[];
  items: WorldItem[];
}

export interface CharacterDraft {
  id: string;
  name: string;
  aliases: string;
  role: '主角' | '主要配角' | '次要配角' | '反派' | '路人';
  appearance: string;
  personality: string;
  speechStyle: string;
  behaviorRules: string;
  growthArc: string;
  sampleDialogue: string;
}

export interface WizardStep3 {
  characters: CharacterDraft[];
}

export interface VolumeOutline {
  id: string;
  volumeNum: number;
  volumeTitle: string;
  chapterRange: string;
  coreConflict: string;
  mainPlot: string;
  systemPhase: string;
  pleasureType: string;
  keyTurningPoints: string;
  emotionalArc: string;
}

export interface WizardStep4 {
  totalChapters: number;
  volumeCount: number;
  volumes: VolumeOutline[];
}

export interface WizardState {
  /** 1-4 已实现，5-6 预留 */
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  /** Step1 完成后由 API 返回并存储 */
  projectId: string | null;
  step1: WizardStep1;
  step2: WizardStep2;
  step3: WizardStep3;
  step4: WizardStep4;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_STATE: WizardState = {
  currentStep: 1,
  projectId: null,
  step1: {
    title: '',
    genre: '',
    synopsis: '',
    targetWords: 1000000,
    styleTags: [],
    coreAbility: '',
  },
  step2: {
    worldBackground: '',
    powerSystem: '',
    factions: [],
    locations: [],
    items: [],
  },
  step3: { characters: [] },
  step4: {
    totalChapters: 200,
    volumeCount: 4,
    volumes: [],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function loadFromStorage(): WizardState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) } as WizardState;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveToStorage(state: WizardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWizardState() {
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  // 客户端挂载后从 localStorage 恢复
  useEffect(() => {
    setState(loadFromStorage());
    setIsHydrated(true);
  }, []);

  const updateState = useCallback((updater: (prev: WizardState) => WizardState) => {
    setState((prev) => {
      const next = updater(prev);
      saveToStorage(next);
      return next;
    });
  }, []);

  // ── Step updaters ──────────────────────────────────────────────────────────

  const setStep1 = useCallback(
    (data: Partial<WizardStep1>) =>
      updateState((prev) => ({ ...prev, step1: { ...prev.step1, ...data } })),
    [updateState]
  );

  const setStep2 = useCallback(
    (data: Partial<WizardStep2>) =>
      updateState((prev) => ({ ...prev, step2: { ...prev.step2, ...data } })),
    [updateState]
  );

  const setStep3 = useCallback(
    (data: Partial<WizardStep3>) =>
      updateState((prev) => ({ ...prev, step3: { ...prev.step3, ...data } })),
    [updateState]
  );

  const setStep4 = useCallback(
    (data: Partial<WizardStep4>) =>
      updateState((prev) => ({ ...prev, step4: { ...prev.step4, ...data } })),
    [updateState]
  );

  const updateVolume = useCallback(
    (id: string, patch: Partial<VolumeOutline>) =>
      updateState((prev) => ({
        ...prev,
        step4: {
          ...prev.step4,
          volumes: prev.step4.volumes.map((v) =>
            v.id === id ? { ...v, ...patch } : v
          ),
        },
      })),
    [updateState]
  );

  // ── Navigation ────────────────────────────────────────────────────────────

  /** Step1 完成后原子性地保存 projectId 并跳到 Step2 */
  const completeStep1 = useCallback(
    (projectId: string) =>
      updateState((prev) => ({ ...prev, projectId, currentStep: 2 })),
    [updateState]
  );

  const goNext = useCallback(
    () =>
      updateState((prev) => ({
        ...prev,
        currentStep: Math.min(prev.currentStep + 1, 6) as WizardState['currentStep'],
      })),
    [updateState]
  );

  const goPrev = useCallback(
    () =>
      updateState((prev) => ({
        ...prev,
        currentStep: Math.max(prev.currentStep - 1, 1) as WizardState['currentStep'],
      })),
    [updateState]
  );

  const goToStep = useCallback(
    (step: WizardState['currentStep']) =>
      updateState((prev) => ({ ...prev, currentStep: step })),
    [updateState]
  );

  /** 从服务端加载已有项目数据，回填向导状态 */
  const initFromProject = useCallback(
    async (projectId: string, targetStep?: number): Promise<boolean> => {
      try {
        const res = await fetch(`/api/projects/${projectId}/wizard/init`);
        if (!res.ok) return false;
        const data = await res.json() as {
          project: {
            title?: string;
            genre?: string;
            synopsis?: string;
            styleDescription?: string;
            tags?: string[];
            targetWords?: { total?: number };
          };
          worldbuilding?: { worldBackground?: string; powerSystem?: string };
          characters?: Array<Record<string, string>>;
        };

        const VALID_ROLES = ['主角', '主要配角', '次要配角', '反派', '路人'] as const;
        const clampStep = (n: number): WizardState['currentStep'] =>
          (Math.min(6, Math.max(1, n || 4))) as WizardState['currentStep'];

        updateState((prev) => ({
          ...prev,
          projectId,
          currentStep: clampStep(targetStep ?? 4),
          step1: {
            title: data.project?.title ?? '',
            genre: (data.project?.genre ?? '') as WizardStep1['genre'],
            synopsis: data.project?.synopsis ?? '',
            targetWords: data.project?.targetWords?.total ?? 1000000,
            styleTags: data.project?.tags ?? [],
            coreAbility: '',
          },
          step2: {
            worldBackground: data.worldbuilding?.worldBackground ?? '',
            powerSystem: data.worldbuilding?.powerSystem ?? '',
            factions: [],
            locations: [],
            items: [],
          },
          step3: {
            characters: (data.characters ?? []).map((c) => ({
              id: c.id ?? genId(),
              name: c.name ?? '',
              aliases: c.aliases ?? '',
              role: (VALID_ROLES.includes(c.role as CharacterDraft['role'])
                ? c.role
                : '主要配角') as CharacterDraft['role'],
              appearance: c.appearance ?? '',
              personality: c.personality ?? '',
              speechStyle: c.speechStyle ?? '',
              behaviorRules: c.behaviorRules ?? '',
              growthArc: c.growthArc ?? '',
              sampleDialogue: c.sampleDialogue ?? '',
            })),
          },
          step4: DEFAULT_STATE.step4,
        }));

        return true;
      } catch {
        return false;
      }
    },
    [updateState]
  );

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(DEFAULT_STATE);
  }, []);

  // ── Step2: dynamic list helpers ───────────────────────────────────────────

  const addWorldItem = useCallback(
    (field: 'factions' | 'locations' | 'items') =>
      updateState((prev) => ({
        ...prev,
        step2: {
          ...prev.step2,
          [field]: [...prev.step2[field], { id: genId(), name: '', description: '' }],
        },
      })),
    [updateState]
  );

  const updateWorldItem = useCallback(
    (field: 'factions' | 'locations' | 'items', id: string, patch: Partial<WorldItem>) =>
      updateState((prev) => ({
        ...prev,
        step2: {
          ...prev.step2,
          [field]: prev.step2[field].map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        },
      })),
    [updateState]
  );

  const removeWorldItem = useCallback(
    (field: 'factions' | 'locations' | 'items', id: string) =>
      updateState((prev) => ({
        ...prev,
        step2: {
          ...prev.step2,
          [field]: prev.step2[field].filter((item) => item.id !== id),
        },
      })),
    [updateState]
  );

  // ── Step3: character helpers ───────────────────────────────────────────────

  const addCharacter = useCallback(
    () =>
      updateState((prev) => ({
        ...prev,
        step3: {
          ...prev.step3,
          characters: [
            ...prev.step3.characters,
            {
              id: genId(),
              name: '',
              aliases: '',
              role: '主要配角' as const,
              appearance: '',
              personality: '',
              speechStyle: '',
              behaviorRules: '',
              growthArc: '',
              sampleDialogue: '',
            },
          ],
        },
      })),
    [updateState]
  );

  const updateCharacter = useCallback(
    (id: string, patch: Partial<CharacterDraft>) =>
      updateState((prev) => ({
        ...prev,
        step3: {
          ...prev.step3,
          characters: prev.step3.characters.map((c) =>
            c.id === id ? { ...c, ...patch } : c
          ),
        },
      })),
    [updateState]
  );

  const removeCharacter = useCallback(
    (id: string) =>
      updateState((prev) => ({
        ...prev,
        step3: {
          ...prev.step3,
          characters: prev.step3.characters.filter((c) => c.id !== id),
        },
      })),
    [updateState]
  );

  return {
    state,
    isHydrated,
    setStep1,
    setStep2,
    setStep3,
    setStep4,
    updateVolume,
    completeStep1,
    goNext,
    goPrev,
    goToStep,
    initFromProject,
    clearDraft,
    addWorldItem,
    updateWorldItem,
    removeWorldItem,
    addCharacter,
    updateCharacter,
    removeCharacter,
  };
}
