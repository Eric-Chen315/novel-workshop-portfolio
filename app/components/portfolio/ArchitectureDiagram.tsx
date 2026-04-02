import type { ReactNode } from 'react';

const frontendRoutes = [
  '/projects',
  '/projects/new/wizard',
  '/projects/:id/knowledge',
  '/projects/:id/workspace',
  '/projects/:id/chapters',
  '/bible',
];

const apiNodes = [
  {
    endpoint: '/api/projects',
    flow: 'Project metadata CRUD',
    target: 'Local JSON filesystem storage',
  },
  {
    endpoint: '/api/write',
    flow: 'Generation orchestration layer',
    target: 'AI model interfaces + file storage + SQLite',
  },
  {
    endpoint: '/api/bible',
    flow: 'Global bible management APIs',
    target: 'SQLite persistent storage',
  },
];

export function ArchitectureDiagram() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-slate-950/45 p-5 md:p-8">
        <div className="pointer-events-none absolute -left-20 top-8 h-60 w-60 rounded-full bg-indigo-500/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-6 h-56 w-56 rounded-full bg-cyan-500/12 blur-3xl" />

        <div className="relative flex flex-col gap-4">
          <NodeCard title="User" subtitle="Writers / Operators">
            <p className="text-sm text-slate-300">Initiates chapter creation and review workflow.</p>
          </NodeCard>

          <VerticalConnector />

          <NodeCard title="Next.js Frontend" subtitle="App Router + UI orchestration">
            <div className="mt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {frontendRoutes.map((route) => (
                <code
                  key={route}
                  className="rounded-lg border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
                >
                  {route}
                </code>
              ))}
            </div>
          </NodeCard>

          <VerticalConnector />

          <NodeCard title="API Layer" subtitle="Route Handlers + orchestration runtime">
            <div className="grid gap-3 md:grid-cols-3">
              {apiNodes.map((api) => (
                <div
                  key={api.endpoint}
                  className="rounded-xl border border-blue-400/25 bg-slate-900/85 p-4"
                >
                  <p className="font-mono text-xs text-blue-200">{api.endpoint}</p>
                  <p className="mt-2 text-sm font-medium text-white">{api.flow}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-300">{api.target}</p>
                </div>
              ))}
            </div>
          </NodeCard>

          <VerticalConnector />

          <NodeCard title="Model + Storage Fabric" subtitle="Execution targets">
            <div className="grid gap-2 sm:grid-cols-3">
              <Pill text="OpenAI-compatible models" />
              <Pill text="Local JSON file storage" />
              <Pill text="SQLite (better-sqlite3)" />
            </div>
          </NodeCard>
        </div>
      </div>
    </div>
  );
}

function NodeCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="glow-card relative rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-blue-300/80">{subtitle}</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function VerticalConnector() {
  return (
    <div className="flex items-center justify-center py-1">
      <div className="h-10 w-[2px] rounded-full bg-gradient-to-b from-blue-400/70 via-indigo-300/50 to-cyan-300/70" />
      <span className="-ml-[9px] rounded-full border border-blue-300/40 bg-slate-950 px-1 text-[10px] text-blue-200">
        v
      </span>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span className="rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-center text-xs text-slate-200">
      {text}
    </span>
  );
}
