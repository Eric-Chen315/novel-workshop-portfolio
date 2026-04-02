import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  archiveProject,
  createProject,
  deleteProject,
  listProjects,
  unarchiveProject,
  updateProject,
} from "@/lib/storage/projectStore";
import type { ProjectGenre, ProjectMeta, ProjectTargetWords } from "@/lib/types/project";

export const runtime = "nodejs";

const GenreSchema = z.enum([
  "玄幻",
  "都市",
  "科幻",
  "言情",
  "悬疑",
  "历史",
  "游戏",
  "末世",
  "其他",
] as const);

const TargetWordsSchema = z.object({
  total: z.number().int().positive(),
  perChapter: z.number().int().positive(),
});

const validGenres = ["玄幻", "都市", "科幻", "言情", "悬疑", "历史", "游戏", "末世", "其他"] as const;

const CreateSchema = z.object({
  title: z.string().min(1),
  genre: z.string().refine(val => validGenres.includes(val as typeof validGenres[number]), {
    message: `genre must be one of: ${validGenres.join(", ")}`
  }),
  targetWords: TargetWordsSchema,
  synopsis: z.string().min(1).max(300),
  styleDescription: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
  coverUrl: z.string().optional(),
});

const UpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  genre: GenreSchema.optional(),
  targetWords: TargetWordsSchema.optional(),
  targetWordsCustom: z.coerce.number().int().positive().optional(),
  synopsis: z.string().min(1).max(300).optional(),
  styleDescription: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  coverUrl: z.string().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const genre = (searchParams.get("genre") || "").trim();
  const status = (searchParams.get("status") || "").trim();

  let data = listProjects();
  if (status === "active" || status === "archived") {
    data = data.filter((p) => p.status === status);
  }
  if (genre) {
    data = data.filter((p) => p.genre === genre);
  }
  if (q) {
    const qq = q.toLowerCase();
    data = data.filter((p) => {
      const tags = (p.tags || []).join(" ");
      return (
        p.title.toLowerCase().includes(qq) ||
        p.synopsis.toLowerCase().includes(qq) ||
        tags.toLowerCase().includes(qq)
      );
    });
  }

  return Response.json({ data });
}

export async function POST(req: Request) {
  let json = null;
  try {
    const text = await req.text();
    console.log('POST raw body:', text);
    json = JSON.parse(text);
    console.log('POST parsed body:', JSON.stringify(json));
  } catch (e) {
    console.error('JSON parse error:', e);
    return Response.json({ error: "Bad Request", details: "Invalid JSON" }, { status: 400 });
  }
  
  const parsed = CreateSchema.safeParse(json);
  console.log('Validation result:', parsed.success ? 'success' : 'failed', parsed.error?.flatten());
  if (!parsed.success) {
    return Response.json({ error: "Bad Request", details: parsed.error.flatten() }, { status: 400 });
  }

  const meta = createProject({
    title: parsed.data.title,
    genre: parsed.data.genre as ProjectGenre,
    targetWords: parsed.data.targetWords as ProjectTargetWords,
    synopsis: parsed.data.synopsis,
    styleDescription: parsed.data.styleDescription,
    tags: parsed.data.tags,
    coverUrl: parsed.data.coverUrl,
  });

  revalidatePath("/projects");

  return Response.json({ data: meta satisfies ProjectMeta });
}

export async function PATCH(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Bad Request", details: parsed.error.flatten() }, { status: 400 });
  }
  const { id, ...patch } = parsed.data;
  const meta = updateProject(id, patch);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return Response.json({ data: meta });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") || "").trim();
  const action = (searchParams.get("action") || "").trim();

  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });
  if (action === "archive") {
    const meta = archiveProject(id);
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return Response.json({ data: meta });
  }
  if (action === "unarchive") {
    const meta = unarchiveProject(id);
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    return Response.json({ data: meta });
  }

  // 默认：彻底删除
  deleteProject(id);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return Response.json({ ok: true });
}
