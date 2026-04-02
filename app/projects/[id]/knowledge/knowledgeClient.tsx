'use client';

import { useState, useEffect } from 'react';
import { Character } from '@/lib/types/character';
import { CharacterForm } from './components/CharacterForm';
import { CharacterList } from './components/CharacterList';
import { WorldBuildingForm } from './components/WorldBuildingForm';
import { OutlineManager } from './components/OutlineManager';
import { FactsManager } from './components/FactsManager';

type TabType = 'characters' | 'worldbuilding' | 'outline' | 'facts';

export function KnowledgeClient({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  // Support URL parameter ?tab=facts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['characters', 'worldbuilding', 'outline', 'facts'].includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, []);

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/knowledge/characters`);
        if (response.ok) {
          const data = await response.json();
          setCharacters(data);
        }
      } catch (error) {
        console.error('Failed to load characters:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCharacters();
  }, [projectId]);

  // 刷新角色列表的函数
  const refreshCharacters = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/knowledge/characters`);
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
      }
    } catch (error) {
      console.error('Failed to refresh characters:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">知识库</h1>
      
      {/* Tab 切换按钮 */}
      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('characters')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'characters'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          角色档案
        </button>
        <button
          onClick={() => setActiveTab('worldbuilding')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'worldbuilding'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          世界观设定
        </button>
        <button
          onClick={() => setActiveTab('outline')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'outline'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          剧情大纲
        </button>
        <button
          onClick={() => setActiveTab('facts')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'facts'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          事实管理
        </button>
      </div>

      {/* Tab 内容区域 */}
      <div className="mt-4">
        {activeTab === 'characters' && (
          <div className="flex gap-6 mt-4">
            <CharacterList 
              characters={characters} 
              onSelect={setSelectedCharacter} 
            />
            <CharacterForm 
              character={selectedCharacter} 
              projectId={projectId} 
              onSave={() => {
                setSelectedCharacter(null);
                refreshCharacters();
              }} 
            />
          </div>
        )}

        {activeTab === 'worldbuilding' && (
          <div className="mt-4">
            <WorldBuildingForm projectId={projectId} />
          </div>
        )}

        {activeTab === 'outline' && (
          <div className="mt-4">
            <OutlineManager projectId={projectId} />
          </div>
        )}

        {activeTab === 'facts' && (
          <div className="mt-4">
            <FactsManager projectId={projectId} />
          </div>
        )}
      </div>
    </div>
  );
}
