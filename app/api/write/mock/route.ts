import { z } from "zod";

import {
  encodeTextStream,
  ensureChapterEndingTextStream,
  stringToStream,
} from "@/lib/chapterEnding";

export const runtime = "edge";

const BodySchema = z.object({
  // 使用与真实接口一致的字段，便于复用前端调用逻辑
  direction: z.string().min(1, "章节方向不能为空"),
  extra: z.string().optional().default(""),
});

/**
 * 提供一个不依赖 OPENAI_API_KEY 的 mock 写作接口，用于本地/CI 校验“章末板块严格模板”。
 *
 * 行为：
 * - 返回一段固定正文
 * - 故意附带一个“格式不严格/多余内容”的章末区域
 * - 由 route.ts 中同款 ensureChapterEndingTextStream 进行最终格式兜底（见调用方脚本）
 */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Bad Request",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { direction, extra } = parsed.data;

  const raw = `正文开始：\n${direction}\n\n（这里是一些正文内容，节奏推进）\n\n`;
  const messyEnding =
    `【下集预告】\n` +
    `（灯泡忽明忽暗，走廊尽头传来脚步声。）你猜是谁？\n\n` +
    `（你觉得下一秒谁会先开口？评论区留个预测。）\n` +
    `PS：这行是多余的，应该被剔除。\n`;
  const tail = `\n附加指令回显：${extra || "无"}\n`;

  // 走同一套“严格模板兜底”逻辑，确保最终输出永远严格。
  const normalized = ensureChapterEndingTextStream(
    stringToStream(raw + messyEnding + tail)
  );

  return new Response(encodeTextStream(normalized), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
