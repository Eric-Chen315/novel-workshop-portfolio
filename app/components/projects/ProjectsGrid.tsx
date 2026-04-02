"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/lib/toast";
import type { ProjectMeta } from "@/lib/types/project";

type ProjectsGridProps = {
  projects: ProjectMeta[];
};

export default function ProjectsGrid({ projects }: ProjectsGridProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(projects);
  const [projectToDelete, setProjectToDelete] = useState<ProjectMeta | null>(null);
  const [projectToRename, setProjectToRename] = useState<ProjectMeta | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const openRenameDialog = (project: ProjectMeta) => {
    setProjectToRename(project);
    setRenameTitle(project.title);
  };

  const handleRename = async () => {
    if (!projectToRename) return;

    const nextTitle = renameTitle.trim();
    if (!nextTitle) {
      toast("书名不能为空", "error");
      return;
    }

    if (nextTitle === projectToRename.title) {
      setProjectToRename(null);
      setRenameTitle("");
      return;
    }

    const currentProject = projectToRename;
    setRenamingId(currentProject.id);

    try {
      const response = await fetch(`/api/projects/${currentProject.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: nextTitle }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.details || data?.error || `HTTP ${response.status}`);
      }

      const updatedProject = data?.data as ProjectMeta;
      setItems((prev) =>
        prev.map((item) => (item.id === currentProject.id ? { ...item, ...updatedProject } : item)),
      );
      setProjectToRename(null);
      setRenameTitle("");
      toast("书名已更新", "success");
      router.refresh();
    } catch (error) {
      toast(`重命名失败：${error instanceof Error ? error.message : "未知错误"}`, "error");
    } finally {
      setRenamingId(null);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;

    const currentProject = projectToDelete;
    setDeletingId(currentProject.id);

    try {
      const response = await fetch(`/api/projects/${currentProject.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.details || data?.error || `HTTP ${response.status}`);
      }

      setItems((prev) => prev.filter((item) => item.id !== currentProject.id));
      setProjectToDelete(null);
      toast("已删除", "success");
      router.refresh();
    } catch (error) {
      toast(`删除失败：${error instanceof Error ? error.message : "未知错误"}`, "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-gray-400 dark:text-gray-500 mb-6 text-sm">还没有作品，立即开始创作吧</p>
        <Link
          href="/projects/new/wizard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          <span>+</span> 创建第一本书
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((project) => {
          const isDeleting = deletingId === project.id;

          return (
            <div
              key={project.id}
              className="relative border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all bg-white dark:bg-gray-900"
            >
              <button
                type="button"
                aria-label={`删除《${project.title}》`}
                onClick={() => setProjectToDelete(project)}
                disabled={Boolean(deletingId) || Boolean(renamingId)}
                className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                ×
              </button>

              <button
                type="button"
                aria-label={`重命名《${project.title}》`}
                onClick={() => openRenameDialog(project)}
                disabled={Boolean(deletingId) || Boolean(renamingId)}
                className="absolute right-12 top-3 z-10 inline-flex items-center justify-center rounded-md px-2 h-8 text-xs text-gray-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
              >
                重命名
              </button>

              <Link href={`/projects/${project.id}/workspace`} className="block pr-28">
                <div className="flex justify-between items-start mb-2 gap-3">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 break-words">
                    {project.title}
                  </h2>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 shrink-0">
                    {project.genre}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                  {project.synopsis?.substring(0, 50) || "无"}…
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs">
                  更新于：{new Date(project.updatedAt).toLocaleDateString("zh-CN")}
                </p>
                {isDeleting && (
                  <p className="mt-2 text-xs text-red-500 dark:text-red-400">正在删除…</p>
                )}
                {renamingId === project.id && (
                  <p className="mt-2 text-xs text-blue-500 dark:text-blue-400">正在更新书名…</p>
                )}
              </Link>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(projectToDelete)} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <DialogContent
          className="dark:bg-zinc-900 dark:text-zinc-100"
          onClose={() => {
            if (!deletingId) setProjectToDelete(null);
          }}
        >
          <DialogHeader>
            <DialogTitle>删除作品</DialogTitle>
            <DialogDescription className="mt-2 dark:text-zinc-400">
              {projectToDelete
                ? `确定要删除《${projectToDelete.title}》吗？此操作不可恢复。`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProjectToDelete(null)}
              disabled={Boolean(deletingId)}
              className="dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              取消
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={Boolean(deletingId)}>
              {deletingId ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(projectToRename)}
        onOpenChange={(open) => {
          if (!open && !renamingId) {
            setProjectToRename(null);
            setRenameTitle("");
          }
        }}
      >
        <DialogContent className="dark:bg-zinc-900 dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle>重命名作品</DialogTitle>
            <DialogDescription className="mt-2 dark:text-zinc-400">
              {projectToRename ? `为《${projectToRename.title}》设置新的书名。` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <label htmlFor="rename-project-title" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              作品名称
            </label>
            <Input
              id="rename-project-title"
              value={renameTitle}
              onChange={(event) => setRenameTitle(event.target.value)}
              placeholder="请输入新的作品名称"
              disabled={Boolean(renamingId)}
              className="w-full dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setProjectToRename(null);
                setRenameTitle("");
              }}
              disabled={Boolean(renamingId)}
              className="dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              取消
            </Button>
            <Button onClick={handleRename} disabled={Boolean(renamingId)}>
              {renamingId ? "保存中..." : "确认保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}