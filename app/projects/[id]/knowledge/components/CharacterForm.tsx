'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Character } from '@/lib/types/character';

export function CharacterForm({ 
  character, 
  projectId,
  onSave 
}: { 
  character: Character | null;
  projectId: string;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<Character | Omit<Character, 'id'>>(
    character || {
      name: '',
      role: '主角',
      appearance: '',
      personality: '',
      speechStyle: '',
      background: '',
      currentState: '',
      relationships: [],
      updatedAt: new Date().toISOString()
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const url = character 
        ? `/api/projects/${projectId}/knowledge/characters/${character.id}`
        : `/api/projects/${projectId}/knowledge/characters`;
      
      const method = character ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save character');
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving character:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-1/2 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">角色名称 *</label>
        <Input 
          value={formData.name} 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
          placeholder="请输入角色名称"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">角色定位 *</label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => setFormData({...formData, role: value as Character['role']})}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择角色定位" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="主角">主角</SelectItem>
            <SelectItem value="主要配角">主要配角</SelectItem>
            <SelectItem value="次要配角">次要配角</SelectItem>
            <SelectItem value="反派">反派</SelectItem>
            <SelectItem value="路人">路人</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">外貌特征</label>
        <Textarea 
          value={formData.appearance} 
          onChange={(e) => setFormData({...formData, appearance: e.target.value})} 
          placeholder="请输入外貌特征"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">性格特征</label>
        <Textarea 
          value={formData.personality} 
          onChange={(e) => setFormData({...formData, personality: e.target.value})} 
          placeholder="请输入性格特征"
          rows={3}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit}>
          {character ? '更新角色' : '创建角色'}
        </Button>
      </div>
    </div>
  );
}
