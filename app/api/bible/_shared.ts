import { z } from "zod";

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
    ...init,
  });
}

export function getIdFromUrl(url: string) {
  const u = new URL(url);
  const id = u.searchParams.get("id");
  return id;
}

export const IdSchema = z.string().min(1);
