import { getProjects } from '@/lib/storage/projectStore';
import ProjectsGrid from '@/components/projects/ProjectsGrid';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">我的作品</h1>
        <Link
          href="/projects/new/wizard"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          <span>+</span> 创建新书
        </Link>
      </div>

      <ProjectsGrid projects={projects} />
    </div>
  );
}