'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

interface NavbarProps {
  projectId: string;
  projectName?: string;
}

const navLinks = [
  { href: 'workspace', label: '工作台' },
  { href: 'chapters', label: '章节管理' },
  { href: 'knowledge', label: '知识库' },
];

export function Navbar({ projectId, projectName = '项目' }: NavbarProps) {
  const pathname = usePathname();

  // 获取当前路径的最后一个部分来判断当前页面
  const currentPath = pathname.split('/').pop() || '';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* 左侧：项目名称 */}
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {projectName}
          </Link>
          <Link
            href="/projects"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            ← 返回项目列表
          </Link>
        </div>

        {/* 中间：导航链接 */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = currentPath === link.href;
            return (
              <Link
                key={link.href}
                href={`/projects/${projectId}/${link.href}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* 右侧：主题切换 */}
        <div className="flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
