'use client';

import { useState, useEffect } from 'react';


interface WorldBuildingData {
  worldBackground: string;
  powerSystem: string;
  factions: string;
  locations: string;
  items: string;
  rulesAndTaboos: string;
}

const sections = [
  { key: 'worldBackground', label: '世界背景概述', placeholder: '描述世界的整体背景、历史沿革...' },
  { key: 'powerSystem', label: '力量/修炼体系', placeholder: '描述修炼等级、力量来源、特殊能力...' },
  { key: 'factions', label: '势力/阵营', placeholder: '描述各大势力、阵营关系、权力结构...' },
  { key: 'locations', label: '关键地点', placeholder: '描述重要地点、地理位置、特殊场所...' },
  { key: 'items', label: '重要道具', placeholder: '描述重要物品、法宝、神器及其作用...' },
  { key: 'rulesAndTaboos', label: '特殊规则与禁忌', placeholder: '描述世界规则、禁忌事项、限制条件...' },
] as const;

export function WorldBuildingForm({ projectId }: { projectId: string }) {
  const [data, setData] = useState<WorldBuildingData>({
    worldBackground: '',
    powerSystem: '',
    factions: '',
    locations: '',
    items: '',
    rulesAndTaboos: '',
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    worldBackground: true,
    powerSystem: false,
    factions: false,
    locations: false,
    items: false,
    rulesAndTaboos: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/knowledge/worldbuilding`)
      .then(res => res.json())
      .then(d => {
        setData({
          worldBackground: d.worldBackground || '',
          powerSystem: d.powerSystem || '',
          factions: d.factions || '',
          locations: d.locations || '',
          items: d.items || '',
          rulesAndTaboos: d.rulesAndTaboos || '',
        });
      });
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/projects/${projectId}/knowledge/worldbuilding`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleExpanded = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {sections.map(({ key, label, placeholder }) => (
        <div key={key} className="border rounded-lg bg-white">
          <button
            onClick={() => toggleExpanded(key)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50"
          >
            <span className="font-medium">{label}</span>
            {expanded[key] ? "▼" : "▶"}
          </button>
          {expanded[key] && (
            <div className="px-4 pb-4">
              <textarea
                value={data[key as keyof WorldBuildingData]}
                onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full h-32 p-3 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      ))}
      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
        {saved && <span className="text-green-600">保存成功！</span>}
      </div>
    </div>
  );
}
