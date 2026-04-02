const stages = [
  {
    stage: 'Stage 1',
    title: 'First Draft',
    detail:
      'Knowledge injection + prompt assembly, then AI generates the initial chapter draft.',
    color: 'from-blue-500/45 to-blue-400/10',
    accent: 'text-blue-200',
  },
  {
    stage: 'Stage 2',
    title: 'Reader Feedback',
    detail:
      'A reader simulator agent evaluates engagement, pacing, and hook effectiveness.',
    color: 'from-violet-500/45 to-violet-400/10',
    accent: 'text-violet-200',
  },
  {
    stage: 'Stage 3',
    title: 'Second Draft',
    detail: 'Feedback is incorporated to rewrite weak sections and improve narrative flow.',
    color: 'from-fuchsia-500/45 to-fuchsia-400/10',
    accent: 'text-fuchsia-200',
  },
  {
    stage: 'Stage 4',
    title: 'QA Review',
    detail:
      'Automated review over Plot Logic, Writing Style, Commercial Appeal, and Structural Compliance.',
    color: 'from-cyan-500/45 to-cyan-400/10',
    accent: 'text-cyan-200',
  },
  {
    stage: 'Stage 5',
    title: 'Final Draft',
    detail:
      'Hard constraints are enforced, chapter ending is corrected, and output is auto-saved.',
    color: 'from-indigo-500/45 to-indigo-400/10',
    accent: 'text-indigo-200',
  },
];

export function PipelineFlow() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="hidden lg:flex lg:items-stretch lg:justify-center lg:gap-2">
        {stages.map((item, index) => (
          <div key={item.title} className="flex items-center gap-2">
            <StageCard {...item} compact />
            {index !== stages.length - 1 ? (
              <div className="flex h-full items-center px-1 text-blue-200/70">{'->'}</div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="space-y-3 lg:hidden">
        {stages.map((item, index) => (
          <div key={item.title}>
            <StageCard {...item} />
            {index !== stages.length - 1 ? (
              <div className="py-2 text-center text-blue-200/70">v</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function StageCard({
  stage,
  title,
  detail,
  color,
  accent,
  compact = false,
}: {
  stage: string;
  title: string;
  detail: string;
  color: string;
  accent: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`glow-card relative overflow-hidden rounded-2xl ${
        compact ? 'w-[220px] p-4' : 'w-full p-5'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
      <div className="relative z-10">
        <p className={`text-[11px] uppercase tracking-[0.2em] ${accent}`}>{stage}</p>
        <h3 className="mt-2 text-base font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-200">{detail}</p>
      </div>
    </div>
  );
}
