import { Navbar } from '@/components/Navbar';
import { getProject } from '@/lib/storage/projectStore';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const projectId = resolvedParams.id;

  // 获取项目信息
  let projectName = '项目';
  try {
    const project = await getProject(projectId);
    if (project) {
      projectName = project.title;
    }
  } catch {
    // 如果获取失败，使用默认名称
  }

  return (
    <div className="min-h-screen">
      <Navbar projectId={projectId} projectName={projectName} />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
