import { notFound, redirect } from "next/navigation";

import { getProject } from "@/lib/storage/projectStore";
import WorkspaceClient from "./workspaceClient";

export const runtime = "nodejs";

export default async function ProjectWorkspacePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const project = getProject(id);
  if (!project) return notFound();
  if (project.status === "archived") {
    // 归档项目不进入工作台（防误操作），跳回列表
    redirect("/projects");
  }

  return <WorkspaceClient projectId={id} projectTitle={project.title} />;
}
