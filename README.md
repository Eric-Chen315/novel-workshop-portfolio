## 小说一站式生成工作台（MVP）

当前实现到 PRD「第一步：最小可用版」：

- 单页面：章节方向输入 + 初稿输出
- 点击“生成”后，调用写手Agent并流式输出
- 支持“中止”（AbortController 立刻中断请求）

### 1) 配置环境变量

复制环境变量模板：

```bash
cp .env.local.example .env.local
```

填入你的 Key：

- `OPENAI_API_KEY`
- 可选：`OPENAI_MODEL`（默认 `gpt-4o-mini`）
- 可选：`OPENAI_BASE_URL`（OpenAI 兼容中转，例如 `https://api.hodlai.fun/v1`）

如果你使用中转服务（OpenAI 兼容格式），可参考：

```env
OPENAI_BASE_URL=https://api.hodlai.fun/v1
OPENAI_MODEL=gemini-2.5-pro
```


### 2) 启动

```bash
npm run dev
```

然后访问： http://localhost:3000

### 说明

- System Prompt（含角色圣经）目前硬编码在 `app/api/write/route.ts`（后续会做 Prompt 实验室与角色管理）。
- 本版本不接数据库、不存储章节。


