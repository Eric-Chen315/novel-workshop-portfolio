/**
 * 验证 /api/write 返回文本末尾是否严格匹配章末模板。
 *
 * 运行：
 *   node scripts/verify-ending.mjs
 */

// NOTE: 某些 Windows 环境里 localhost 可能触发奇怪的代理/认证提示，
// 这里固定用 127.0.0.1，避免被劫持。
// 默认验证 mock 接口（不依赖 OPENAI_API_KEY）。
// 如需验证真实模型输出，把路径改为 /api/write。
const uri = "http://127.0.0.1:3000/api/write/mock";
const payload = {
  direction: "测试：李弈在雨夜追踪灰衣人留下的线索，结尾留强悬念",
  extra: "不要写战斗，偏信息差；注意章末板块严格模板",
};

// 新规范：互动引导不得用括号包裹；预告允许 1-2 句（这里不强制括号）。
// - 第一行必须是【下集预告】
// - 第二行：1~120 字（不含换行）
// - 空行
// - 第四行：1~120 字，且首尾不能是中文括号（…）
const strictEndingRegex =
  /【下集预告】\n[^\n]{1,120}\n\n(?!（)[^\n]{1,120}(?<!）)\s*$/;

console.log("POST", uri);

const res = await fetch(uri, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

console.log("status", res.status);
if (!res.ok) {
  console.error(await res.text().catch(() => ""));
  process.exit(1);
}

if (!res.body) {
  console.error("No response body");
  process.exit(1);
}

// 只保留末尾窗口，避免把整章内容都攒在内存里。
const TAIL_WINDOW = 20000;
let text = "";

const reader = res.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  text += decoder.decode(value, { stream: true });
  if (text.length > TAIL_WINDOW) text = text.slice(-TAIL_WINDOW);
}
text += decoder.decode();
text = text.replace(/\r/g, "");

const ok = strictEndingRegex.test(text);
console.log("strictEndingMatch", ok);

const idx = text.lastIndexOf("【下集预告】");
const tail = idx >= 0 ? text.slice(idx) : text.slice(-1000);

console.log("---TAIL_START---");
console.log(tail);
console.log("---TAIL_END---");

process.exit(ok ? 0 : 2);
