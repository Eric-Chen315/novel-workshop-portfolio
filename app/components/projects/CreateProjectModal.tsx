'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProjectTargetWords } from '@/lib/types/project';

export default function CreateProjectModal() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    wordCount: '',
    description: '',
    style: '',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const genres = ['玄幻', '都市', '科幻', '言情', '悬疑', '历史', '游戏', '末世', '其他'];
  const wordCounts = ['30万', '50万', '100万', '200万'];

  const isFormValid = formData.title && formData.genre && formData.description && formData.style;

  // 字数选项到数值的映射
  const wordCountMap: Record<string, { total: number; perChapter: number }> = {
    '30万': { total: 300000, perChapter: 3000 },
    '50万': { total: 500000, perChapter: 3000 },
    '100万': { total: 1000000, perChapter: 3000 },
    '200万': { total: 2000000, perChapter: 3000 },
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 将选项值转换为对象格式
      const targetWords = formData.wordCount 
        ? wordCountMap[formData.wordCount] 
        : { total: 300000, perChapter: 3000 };
      
      console.log('Submitting targetWords:', targetWords);
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          genre: formData.genre,
          targetWords,
          synopsis: formData.description,
          styleDescription: formData.style,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      });
      if (!response.ok) {
        throw new Error('Failed to create project');
      }
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>新建作品</Button>
      </DialogTrigger>
      <DialogContent onClose={handleClose}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>新建作品</DialogTitle>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="关闭"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">作品标题 *</label>
            <Input 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              placeholder="请输入作品标题"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">作品类型 *</label>
            <Select value={formData.genre} onValueChange={(value) => setFormData({...formData, genre: value})}>
              <SelectTrigger>
                <SelectValue placeholder="选择作品类型" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">目标字数</label>
            <Select value={formData.wordCount} onValueChange={(value) => setFormData({...formData, wordCount: value})}>
              <SelectTrigger>
                <SelectValue placeholder="选择目标字数" />
              </SelectTrigger>
              <SelectContent>
                {wordCounts.map((count) => (
                  <SelectItem key={count} value={count}>{count}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">作品简介 *</label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              placeholder="请描述核心冲突和主线剧情"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">文风说明 *</label>
            <Textarea 
              value={formData.style} 
              onChange={(e) => setFormData({...formData, style: e.target.value})} 
              placeholder="例如：轻松幽默风，节奏快，对话多"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">标签（逗号分隔）</label>
            <Input 
              value={formData.tags} 
              onChange={(e) => setFormData({...formData, tags: e.target.value})} 
              placeholder="例如：穿越,系统,群像"
            />
          </div>

          {!isFormValid && (
            <p className="text-sm text-red-500">先补充这些设定，AI才能更贴合你的故事</p>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建作品'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}