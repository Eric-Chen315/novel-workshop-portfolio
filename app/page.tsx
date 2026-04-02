import { ArchitectureDiagram } from '@/components/portfolio/ArchitectureDiagram';
import { PipelineFlow } from '@/components/portfolio/PipelineFlow';
import { Reveal } from '@/components/portfolio/Reveal';
import { SectionHeading } from '@/components/portfolio/SectionHeading';

const heroTechStack = [
  'Next.js 16',
  'React 19',
  'TypeScript 5',
  'OpenAI API',
  'SQLite',
  'Tailwind CSS 4',
  'Streaming SSE',
  'Multi-Agent Pipeline',
];

const featureCards = [
  {
    icon: '\u2699\uFE0F',
    title: 'Multi-Stage AI Generation Pipeline',
    description:
      '5-step writing flow: Draft -> Reader Feedback -> Revision -> QA Review -> Final Draft. Each stage routes to fit-for-purpose models instead of one-shot generation.',
  },
  {
    icon: '\u{1F4DA}',
    title: 'Knowledge Base System',
    description:
      'Structured character bibles, worldbuilding docs, and plot outlines are injected before generation with strict per-project isolation.',
  },
  {
    icon: '\u{1F9E9}',
    title: 'Hard Constraint Engine',
    description:
      'Anchor text enforcement, word count gates, pattern blocking, pronoun rules, chapter ending correction, and formatting normalization.',
  },
  {
    icon: '\u{1F6F0}\uFE0F',
    title: 'Multi-Model Orchestration',
    description:
      'Dynamic model selection per stage with token estimation, prompt optimization, and OpenAI-compatible API endpoints via configurable base URLs.',
  },
  {
    icon: '\u{1F4E1}',
    title: 'Real-time Streaming Output',
    description:
      'Server-Sent Events stream content as it is generated, with completion auto-save and built-in retry handling for transient failures.',
  },
  {
    icon: '\u{1F5C3}\uFE0F',
    title: 'Global Bible Management',
    description:
      'Cross-project character and setting database backed by SQLite, auto-injected into writer and QA prompts for long-form consistency.',
  },
];

const techStackGroups = [
  {
    category: 'Frontend',
    items: ['Next.js 16', 'React 19', 'TypeScript 5', 'Tailwind CSS 4'],
  },
  {
    category: 'Backend',
    items: ['Next.js Route Handlers', 'Node.js', 'Zod validation'],
  },
  {
    category: 'AI',
    items: ['OpenAI SDK', 'AI SDK', 'Multi-model routing', 'Streaming'],
  },
  {
    category: 'Storage',
    items: ['Local JSON filesystem', 'SQLite (better-sqlite3)'],
  },
  {
    category: 'Architecture',
    items: ['App Router', 'Server Components', 'SSE streaming'],
  },
];

export default function Home() {
  return (
    <main className="grid-ambient min-h-screen overflow-x-clip pb-16 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-5 pt-10 md:px-8 md:pt-16">
        <Reveal>
          <section className="relative rounded-3xl border border-slate-700/70 bg-slate-950/45 p-6 md:p-10">
            <div className="pointer-events-none absolute -left-12 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />

            <div className="relative">
              <p className="text-xs uppercase tracking-[0.24em] text-blue-300/90">Portfolio Case Study</p>
              <h1 className="mt-4 text-balance bg-gradient-to-r from-blue-200 via-indigo-100 to-cyan-200 bg-clip-text text-4xl font-semibold text-transparent md:text-6xl">
                AI-Powered Novel Production Pipeline
              </h1>
              <p className="mt-6 max-w-4xl text-sm leading-7 text-slate-300 md:text-lg md:leading-8">
                A multi-stage AI writing workstation with knowledge injection, automated quality
                review, and constraint enforcement engine. Built for production-grade AI content
                orchestration.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                {heroTechStack.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-600/80 bg-slate-900/70 px-3 py-1 text-xs text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <a
                  href="#architecture"
                  className="floating-glow inline-flex items-center rounded-xl border border-blue-300/35 bg-blue-500/18 px-5 py-3 text-sm font-medium text-blue-100 transition hover:border-blue-200/60 hover:bg-blue-500/28"
                >
                  {'View Architecture \u2193'}
                </a>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delayMs={60}>
          <section id="architecture" className="mt-20 scroll-mt-16">
            <SectionHeading
              eyebrow="System Design"
              title="System Architecture"
              description="A production-oriented pipeline that combines typed route-level orchestration, multi-step generation, and mixed storage layers for speed and persistence."
            />
            <div className="mt-10">
              <ArchitectureDiagram />
            </div>
          </section>
        </Reveal>

        <Reveal delayMs={80}>
          <section className="mt-20">
            <SectionHeading
              eyebrow="Core Capabilities"
              title="Core Features"
              description="Designed as an end-to-end writing system, not a single prompt wrapper."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {featureCards.map((feature) => (
                <article key={feature.title} className="glow-card relative rounded-2xl p-5">
                  <p className="text-2xl">{feature.icon}</p>
                  <h3 className="mt-3 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">{feature.description}</p>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal delayMs={100}>
          <section className="mt-20">
            <SectionHeading
              eyebrow="Pipeline Walkthrough"
              title="How the AI Writing Pipeline Works"
              description="Each stage has a focused responsibility and hands over structured outputs to the next stage."
            />
            <div className="mt-10">
              <PipelineFlow />
            </div>
          </section>
        </Reveal>

        <Reveal delayMs={120}>
          <section className="mt-20">
            <SectionHeading eyebrow="Technology" title="Tech Stack" />
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {techStackGroups.map((group) => (
                <article key={group.category} className="glow-card relative rounded-2xl p-5">
                  <h3 className="text-sm uppercase tracking-[0.18em] text-blue-300/85">
                    {group.category}
                  </h3>
                  <ul className="mt-4 space-y-2 text-sm text-slate-200">
                    {group.items.map((item) => (
                      <li key={item} className="rounded-lg border border-slate-700/70 bg-slate-900/70 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal delayMs={150}>
          <footer className="mt-20 rounded-2xl border border-slate-700/70 bg-slate-950/50 p-8 text-center">
            <p className="text-lg font-semibold text-white">Built by Eric C.</p>
            <p className="mt-2 text-sm text-slate-300">AI App Developer &amp; Vibe Coding Specialist</p>
            <p className="mt-2 text-sm text-slate-300">Available for freelance projects</p>
            <a
              href="#"
              className="mt-6 inline-flex rounded-xl border border-indigo-300/40 bg-indigo-500/20 px-5 py-3 text-sm font-medium text-indigo-100 transition hover:border-indigo-200/70 hover:bg-indigo-500/30"
            >
              Hire Me on Upwork
            </a>
          </footer>
        </Reveal>
      </div>
    </main>
  );
}
