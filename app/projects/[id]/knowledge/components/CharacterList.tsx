'use client';

import { Character } from '@/lib/types/character';
import { Button } from '@/components/ui/button';

export function CharacterList({ 
  characters,
  onSelect 
}: { 
  characters: Character[];
  onSelect: (character: Character | null) => void;
}) {
  return (
    <div className="w-1/2 space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">角色列表</h2>
        <Button variant="outline" onClick={() => onSelect(null)}>
          添加角色
        </Button>
      </div>

      <div className="space-y-2">
        {characters.map((character) => (
          <div 
            key={character.id} 
            className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelect(character)}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{character.name}</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                {character.role}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {character.personality || '暂无性格描述'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
