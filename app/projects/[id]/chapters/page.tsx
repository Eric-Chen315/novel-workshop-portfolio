'use client';

import { useState, useEffect, useMemo } from 'react';
import { use } from 'react';
import { Chapter } from '@/lib/types/chapter';
import { ThemeToggle } from '@/components/ThemeToggle';

// 骨架屏组件
function ChapterCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex justify-between items-start mb-2">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
      </div>
    </div>
  );
}

export default function ChapterManager({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  
  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'chapterNum' | 'updatedAt' | 'wordCount'>('chapterNum');
  const [filterStatus, setFilterStatus] = useState<'all' | '已完成' | '草稿中'>('all');
  
  // 动画状态
  const [fadeIn, setFadeIn] = useState(false);
  const [deletingChapterNum, setDeletingChapterNum] = useState<number | null>(null);

  // 导出弹窗状态
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'all' | 'range'>('all');
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');

  // 更新预告弹窗状态
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewStart, setPreviewStart] = useState('');
  const [previewEnd, setPreviewEnd] = useState('');
  const [previewProgress, setPreviewProgress] = useState({ current: 0, total: 0, message: '' });
  const [isUpdatingPreview, setIsUpdatingPreview] = useState(false);

  useEffect(() => {
    const loadChapters = async () => {
      try {
        const response = await fetch(`/api/projects/${id}/chapters`);
        if (response.ok) {
          const loadedChapters = await response.json();
          const normalizedChapters = loadedChapters.map((c: any) => ({
            ...c,
            chapterNum: c.num,
          }));
          const sortedChapters = [...normalizedChapters].sort((a, b) => {
            const numA = typeof a.chapterNum === 'string' ? parseInt(a.chapterNum, 10) : a.chapterNum;
            const numB = typeof b.chapterNum === 'string' ? parseInt(b.chapterNum, 10) : b.chapterNum;
            return numA - numB;
          });
          setChapters(sortedChapters);
          if (sortedChapters.length > 0) {
            setSelectedChapter(sortedChapters[0]);
            setFadeIn(true);
          }
        }
      } catch (error) {
        console.error('Failed to load chapters:', error);
      } finally {
        setLoading(false);
      }
    };
    loadChapters();
  }, [id]);

  // 筛选和排序后的章节
  const filteredChapters = useMemo(() => {
    let result = [...chapters];
    
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.content.toLowerCase().includes(query)
      );
    }
    
    // 状态筛选
    if (filterStatus !== 'all') {
      result = result.filter(c => c.status === filterStatus);
    }
    
    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'wordCount':
          return b.wordCount - a.wordCount;
        case 'chapterNum':
        default:
          const numA = typeof a.chapterNum === 'string' ? parseInt(a.chapterNum, 10) : a.chapterNum;
          const numB = typeof b.chapterNum === 'string' ? parseInt(b.chapterNum, 10) : b.chapterNum;
          return numA - numB;
      }
    });
    
    return result;
  }, [chapters, searchQuery, sortBy, filterStatus]);

  // 统计数据
  const totalWords = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);

  const handleDelete = async (chapter: Chapter) => {
    if (!confirm(`确定要删除第${chapter.chapterNum}章 "${chapter.title}" 吗？`)) {
      return;
    }
    
    setDeletingChapterNum(chapter.chapterNum as number);
    
    // 等待动画完成
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const response = await fetch(`/api/projects/${id}/chapters/${chapter.chapterNum}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        const updatedChapters = chapters.filter(c => c.chapterNum !== chapter.chapterNum);
        setChapters(updatedChapters);
        
        if (selectedChapter?.chapterNum === chapter.chapterNum) {
          setSelectedChapter(updatedChapters.length > 0 ? updatedChapters[0] : null);
          setFadeIn(true);
        }
        
        alert('章节已删除');
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('Failed to delete chapter:', error);
      alert('删除失败');
    } finally {
      setDeletingChapterNum(null);
    }
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setEditContent(chapter.content);
    setEditTitle(chapter.title);
  };

  const handleSave = async () => {
    if (!editingChapter) return;

    try {
      const updatedChapter: Chapter = {
        ...editingChapter,
        title: editTitle,
        content: editContent,
        wordCount: editContent.length,
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`/api/projects/${id}/chapters/${editingChapter.chapterNum}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedChapter),
      });

      if (response.ok) {
        const updatedChapters = chapters.map(c => 
          c.chapterNum === editingChapter.chapterNum ? updatedChapter : c
        );
        setChapters(updatedChapters);
        setSelectedChapter(updatedChapter);
        setEditingChapter(null);
        alert('保存成功');
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('Failed to save chapter:', error);
      alert('保存失败');
    }
  };

  const handleCancel = () => {
    setEditingChapter(null);
    setEditContent('');
    setEditTitle('');
  };

  const handleConfirmExport = () => {
    let toExport = [...chapters].sort((a, b) => {
      const na = typeof a.chapterNum === 'string' ? parseInt(a.chapterNum, 10) : a.chapterNum;
      const nb = typeof b.chapterNum === 'string' ? parseInt(b.chapterNum, 10) : b.chapterNum;
      return na - nb;
    });

    if (exportMode === 'range') {
      const start = parseInt(exportStart, 10);
      const end = parseInt(exportEnd, 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        toExport = toExport.filter(c => {
          const n = typeof c.chapterNum === 'string' ? parseInt(c.chapterNum, 10) : c.chapterNum;
          return n >= start && n <= end;
        });
      }
    }

    const content = toExport
      .map(chapter => `第${chapter.chapterNum}章 ${chapter.title}\n\n${chapter.content}`)
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project_${id}_chapters.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setFadeIn(false);
    setTimeout(() => {
      setSelectedChapter(chapter);
      setFadeIn(true);
    }, 50);
  };

  // 更新预告处理函数
  const handleUpdatePreview = async () => {
    const start = parseInt(previewStart, 10);
    const end = parseInt(previewEnd, 10);

    if (isNaN(start) || isNaN(end)) {
      alert('请输入有效的章节号');
      return;
    }
    if (start > end) {
      alert('起始章节号不能大于结束章节号');
      return;
    }

    setIsUpdatingPreview(true);
    const total = end - start + 1;
    setPreviewProgress({ current: 0, total, message: '开始更新预告...' });

    for (let i = start; i <= end; i++) {
      setPreviewProgress({ 
        current: i - start + 1, 
        total, 
        message: `正在更新第${i}章预告... (${i - start + 1}/${total})` 
      });

      try {
        const response = await fetch(`/api/projects/${id}/chapters/${i}/preview`, {
          method: 'POST',
        });

        const result = await response.json();
        
        if (result.skipped) {
          console.log(`第${i}章: ${result.message}`);
        } else if (!result.success) {
          console.error(`第${i}章预告更新失败:`, result.error);
        } else {
          console.log(`第${i}章预告已更新`);
        }
      } catch (error) {
        console.error(`第${i}章预告更新失败:`, error);
      }

      // 间隔1秒
      if (i < end) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setPreviewProgress({ 
      current: total, 
      total, 
      message: `已完成！成功更新第${start}-${end}章的下集预告` 
    });
    
    setTimeout(() => {
      setIsUpdatingPreview(false);
      setShowPreviewModal(false);
      setPreviewStart('');
      setPreviewEnd('');
      alert(`已更新第${start}-${end}章的下集预告`);
    }, 2000);
  };

  // 空状态组件
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center py-16">
      <div className="w-32 h-32 mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">暂无章节</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">开始创建你的第一个章节吧</p>
      <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
        导入章节
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">章节管理</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setExportMode('all'); setExportStart(''); setExportEnd(''); setShowExportModal(true); }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              导出TXT
            </button>
            <button
              onClick={() => { setPreviewStart(''); setPreviewEnd(''); setShowPreviewModal(true); }}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              更新下集预告
            </button>
            <ThemeToggle />
          </div>
        </div>
        
        {/* 搜索和筛选工具栏 */}
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索标题或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          {/* 排序选择 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="chapterNum">按章节号</option>
            <option value="updatedAt">按更新时间</option>
            <option value="wordCount">按字数</option>
          </select>
          
          {/* 状态筛选 */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
            {(['all', '已完成', '草稿中'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' ? '全部' : status}
              </button>
            ))}
          </div>
          
          {/* 统计信息 */}
          <div className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
            共 {chapters.length} 章
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧章节列表 */}
        <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 space-y-3">
            {loading ? (
              // 骨架屏
              Array.from({ length: 5 }).map((_, i) => (
                <ChapterCardSkeleton key={i} />
              ))
            ) : filteredChapters.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery || filterStatus !== 'all' ? '没有匹配的章节' : '暂无章节'}
              </div>
            ) : (
              filteredChapters.map((chapter) => (
                <div
                  key={String(chapter.chapterNum)}
                  onClick={() => handleChapterSelect(chapter)}
                  className={`
                    bg-white dark:bg-gray-800 rounded-lg p-4 border-2 cursor-pointer transition-all duration-200
                    hover:shadow-lg hover:-translate-y-0.5
                    ${selectedChapter?.chapterNum === chapter.chapterNum 
                      ? 'border-l-4 border-l-blue-500 border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                    }
                    ${deletingChapterNum === chapter.chapterNum ? 'opacity-0 transition-opacity duration-300' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      第{chapter.chapterNum}章
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {chapter.wordCount}字
                    </span>
                  </div>
                  <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-2 line-clamp-1">
                    {chapter.title}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(chapter.updatedAt).toLocaleDateString('zh-CN')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      chapter.status === '已完成' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {chapter.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* 底部统计 */}
          {!loading && chapters.length > 0 && (
            <div className="sticky bottom-0 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
              共 {chapters.length} 章，总计 {(totalWords / 10000).toFixed(1)} 万字
            </div>
          )}
        </div>

        {/* 右侧章节内容 */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          {selectedChapter ? (
            <div 
              className={`h-full p-8 transition-opacity duration-200 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
            >
              {/* 内容头部 */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {editingChapter ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-2xl font-bold w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      />
                    ) : (
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        第{selectedChapter.chapterNum}章 {selectedChapter.title}
                      </h2>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>创建时间: {new Date(selectedChapter.createdAt).toLocaleString('zh-CN')}</span>
                      <span>更新时间: {new Date(selectedChapter.updatedAt).toLocaleString('zh-CN')}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{selectedChapter.wordCount} 字</span>
                    </div>
                  </div>
                  
                  {/* 编辑/删除按钮 */}
                  <div className="flex gap-2 ml-4">
                    {editingChapter ? (
                      <>
                        <button 
                          onClick={handleSave}
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                          title="保存"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button 
                          onClick={handleCancel}
                          className="p-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                          title="取消"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleEdit(selectedChapter)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="编辑"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(selectedChapter)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          title="删除"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 内容区域 */}
              <div className="prose max-w-none">
                {editingChapter ? (
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-[calc(100vh-280px)] p-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="开始写作..."
                  />
                ) : (
                  <div className="text-gray-800 dark:text-gray-200 leading-loose text-lg whitespace-pre-wrap">
                    {selectedChapter.content}
                  </div>
                )}
              </div>
              
              {/* 编辑模式下的字数统计 */}
              {editingChapter && (
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                  当前字数: {editContent.length}
                </div>
              )}
            </div>
          ) : (
            !loading && <EmptyState />
          )}
        </div>
      </div>

      {/* 导出弹窗 */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowExportModal(false)}>
          <div className="fixed inset-0 bg-black/50" />
          <div
            className="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-6 w-80 mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-white">导出章节 TXT</h3>
            <div className="space-y-3 mb-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={exportMode === 'all'}
                  onChange={() => setExportMode('all')}
                  className="accent-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  全部导出（共 {chapters.length} 章）
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={exportMode === 'range'}
                  onChange={() => setExportMode('range')}
                  className="accent-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">按范围导出</span>
              </label>
              {exportMode === 'range' && (
                <div className="flex items-center gap-2 pl-6">
                  <input
                    type="number"
                    value={exportStart}
                    onChange={(e) => setExportStart(e.target.value)}
                    placeholder="起始章"
                    className="w-24 px-2 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="number"
                    value={exportEnd}
                    onChange={(e) => setExportEnd(e.target.value)}
                    placeholder="结束章"
                    className="w-24 px-2 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmExport}
                disabled={exportMode === 'range' && (!exportStart || !exportEnd)}
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 更新预告弹窗 */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !isUpdatingPreview && setShowPreviewModal(false)}>
          <div
            className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold mb-4 text-gray-900 dark:text-white">更新下集预告</h3>
            
            {!isUpdatingPreview ? (
              <>
                <div className="space-y-3 mb-5">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    根据下一章细纲自动生成预告内容，替换章节末尾的"下集预告"部分
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={previewStart}
                      onChange={(e) => setPreviewStart(e.target.value)}
                      placeholder="起始章节号"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-gray-400">—</span>
                    <input
                      type="number"
                      value={previewEnd}
                      onChange={(e) => setPreviewEnd(e.target.value)}
                      placeholder="结束章节号"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    注意：最后一章没有下一章，将自动跳过
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleUpdatePreview}
                    disabled={!previewStart || !previewEnd}
                    className="px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    开始更新
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {previewProgress.message}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(previewProgress.current / previewProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {previewProgress.current} / {previewProgress.total}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
