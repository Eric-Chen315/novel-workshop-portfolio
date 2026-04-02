import { revalidatePath } from "next/cache";

import { deleteProject, getProject, updateProject } from "@/lib/storage/projectStore";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const data = getProject(id);
  if (!data) return Response.json({ error: "Not Found" }, { status: 404 });
  return Response.json({ data });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(id);

  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const body = (await req.json().catch(() => null)) as { title?: string } | null;
    const title = body?.title?.trim();

    if (!title) {
      return Response.json({ error: "书名不能为空" }, { status: 400 });
    }

    const data = updateProject(id, { title });
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    revalidatePath(`/projects/${id}/workspace`);

    return Response.json({ data });
  } catch (error) {
    return Response.json(
      {
        error: "Update Failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(id);

  if (!project) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    deleteProject(id);
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      {
        error: "Delete Failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
