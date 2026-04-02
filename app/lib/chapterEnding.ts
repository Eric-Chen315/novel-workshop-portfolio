/**
 * 章末板块严格模板兜底（流式兼容）。
 *
 * 最终输出末尾必须出现且只出现一次严格模板：
 *
 * 【下集预告】
 * （1-2句画面/台词钩子）
 *
 * 1句互动引导（不得用括号包裹）
 */

export function ensureChapterEndingTextStream(input: ReadableStream<string>) {
  const tag = "【下集预告】";

  // 兜底文案：必须符合“无括号互动引导”的新规范。
  const fallbackHook =
    "门缝里滑出一张纸，只有一句话：\"别回头。\"";
  const fallbackCta = "觉得灰衣人下一步会怎么做？评论区留个预测。";

  const buildStrictEnding = (hook: string, cta: string) =>
    `\n\n【下集预告】\n${hook}\n\n${cta}`;

  const tagCarryLen = Math.max(0, tag.length - 1);

  let state: "before" | "after" = "before";
  let carry = "";
  let afterTagBuffer = "";

  function sanitizeOneLine(text: string) {
    return text.replace(/\r/g, "").replace(/\n/g, "").trim();
  }

  function stripChineseParens(text: string) {
    const t = text.trim();
    if (t.startsWith("（") && t.endsWith("）") && t.length >= 2) {
      return t.slice(1, -1).trim();
    }
    return t;
  }

  function clamp(text: string, maxLen: number) {
    const t = text.trim();
    if (t.length <= maxLen) return t;
    return t.slice(0, maxLen).trim();
  }

  function extractHookAndCta(buffer: string) {
    const normalized = buffer.replace(/\r/g, "");
    const lines = normalized.split("\n");

    const isNoiseLine = (line: string) => {
      const t = line.trim();
      if (!t) return true;
      // 常见噪音：PS、附加指令回显、作者话术等
      if (/^(PS|P\.S\.|ps|p\.s\.)[:：]?/i.test(t)) return true;
      if (/^附加指令回显[:：]?/.test(t)) return true;
      return false;
    };

    // 1) hook：取 tag 后第一段“非空且非噪音”的连续行，最多两行（便于 1-2 句）。
    let i = 0;
    while (i < lines.length && isNoiseLine(lines[i])) i++;

    const hookLines: string[] = [];
    while (i < lines.length) {
      const rawLine = lines[i];
      const line = rawLine.trim();
      if (!line) break;
      if (!isNoiseLine(rawLine)) hookLines.push(line);
      i++;
      if (hookLines.length >= 2) break;
    }
    const hook = clamp(sanitizeOneLine(hookLines.join("")), 120);

    // 2) cta：优先找“下一段”的第一条有效行；若不存在，则在剩余行里找第一条有效行。
    while (i < lines.length && lines[i].trim() !== "") i++; // 跳到段落结束
    while (i < lines.length && lines[i].trim() === "") i++; // 跳过空行到下一段

    let cta = "";
    while (i < lines.length) {
      const rawLine = lines[i];
      const line = rawLine.trim();
      if (!line) {
        i++;
        continue;
      }
      if (isNoiseLine(rawLine)) {
        i++;
        continue;
      }
      cta = line;
      break;
    }

    cta = clamp(sanitizeOneLine(stripChineseParens(cta)), 120);

    return {
      hook: hook || fallbackHook,
      cta: cta || fallbackCta,
    };
  }

  return input.pipeThrough(
    new TransformStream<string, string>({
      transform(chunk, controller) {
        if (state === "after") {
          afterTagBuffer += chunk;
          return;
        }

        const combined = carry + chunk;
        const idx = combined.indexOf(tag);

        if (idx === -1) {
          if (combined.length <= tagCarryLen) {
            carry = combined;
            return;
          }

          const safePart = combined.slice(0, combined.length - tagCarryLen);
          carry = combined.slice(-tagCarryLen);
          controller.enqueue(safePart);
          return;
        }

        // 找到 tag：输出 tag 之前正文；tag 及其后内容缓存，最终统一按严格模板输出
        const before = combined.slice(0, idx);
        controller.enqueue(before);

        state = "after";
        carry = "";
        afterTagBuffer = combined.slice(idx + tag.length);
      },
      flush(controller) {
        if (state === "before") {
          if (carry) controller.enqueue(carry);
          controller.enqueue(buildStrictEnding(fallbackHook, fallbackCta));
          return;
        }

        // 从模型章末内容中提取 hook 与互动引导，并统一按严格模板输出。
        // 关键点：互动引导禁止用括号包裹，因此这里会自动去除首尾中文括号。
        const { hook, cta } = extractHookAndCta(afterTagBuffer);
        controller.enqueue(buildStrictEnding(hook, cta));
      },
    })
  );
}

/** 将普通字符串包装为 ReadableStream<string>（便于 mock 场景复用同一套流式兜底） */
export function stringToStream(text: string): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      controller.enqueue(text);
      controller.close();
    },
  });
}

/** 将 ReadableStream<string> 变为 Uint8Array stream，便于 Response body 输出 */
export function encodeTextStream(
  input: ReadableStream<string>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return input.pipeThrough(
    new TransformStream<string, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(encoder.encode(chunk));
      },
    })
  );
}
