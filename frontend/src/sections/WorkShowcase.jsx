import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Scale,
  Network,
  Layers,
  Flower2,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import Reveal, { Eyebrow } from '../components/Reveal';
import { PROJECTS } from '../data/projects';
import { cn } from '../lib/utils';

// No screenshots of client sites exist, and hotlinking their assets at runtime is not an
// option, so each project gets a generated mark instead: a sector glyph over a wash keyed
// to the project. The six read as a family while staying individually recognisable.
const GLYPHS = {
  scales: Scale,
  hub: Network,
  stack: Layers,
  bloom: Flower2,
  ascend: TrendingUp,
  flow: Workflow,
};

function ProjectCard({ project, featured }) {
  const Glyph = GLYPHS[project.glyph] || Layers;

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${project.name} — open the live site in a new tab`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface',
        // Lift and hairline shift are the whole hover language: transform + colour only,
        // 200ms on the UI curve. Nothing here triggers layout.
        'transition-[transform,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'hover:-translate-y-1 hover:border-aurora-teal/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        featured && 'lg:col-span-2'
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-line transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:bg-aurora-teal"
      />

      <div
        aria-hidden="true"
        className={cn(
          'relative flex items-center justify-between overflow-hidden bg-gradient-to-br px-7 py-8',
          project.wash,
          featured ? 'min-h-[190px]' : 'min-h-[150px]'
        )}
      >
        <span
          className={cn(
            'font-display font-bold leading-none tracking-tightest text-text/90',
            featured ? 'text-6xl sm:text-7xl' : 'text-5xl'
          )}
        >
          {project.initials}
        </span>
        <Glyph
          className={cn(
            'shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110',
            project.glyphColor,
            featured ? 'h-14 w-14' : 'h-10 w-10'
          )}
          strokeWidth={1.25}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-7">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-dim">
            {project.sector}
          </span>
          <span className="font-mono text-[11px] text-text-dim">{project.domain}</span>
        </div>

        <h3 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl">
          {project.name}
        </h3>

        <p
          className={cn(
            'text-sm leading-relaxed text-text-dim',
            !featured && 'line-clamp-4'
          )}
        >
          {project.summary}
        </p>

        <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-sm font-medium text-text">
          Visit the live site
          <ArrowUpRight className="h-4 w-4 transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </a>
  );
}

/**
 * The portfolio grid. `limit` lets the home page show a subset while /work shows all six
 * from the same data source.
 */
export default function WorkShowcase({ limit, showViewAll = false, className }) {
  const projects = limit ? PROJECTS.slice(0, limit) : PROJECTS;

  return (
    <section className={cn('relative py-section', className)}>
      <div className="mx-auto max-w-content px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>Selected work</Eyebrow>
          <h2 className="mt-5 font-display text-4xl font-bold tracking-tightest text-text sm:text-5xl">
            Systems running in production.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-text-dim">
            Every site below belongs to a real business and is live today. Open any of them
            and judge the work directly.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal
              key={project.id}
              y={48}
              delay={i * 0.08}
              className={cn('flex', i === 0 && 'lg:col-span-2')}
            >
              <ProjectCard project={project} featured={i === 0} />
            </Reveal>
          ))}
        </div>

        {showViewAll && (
          <Reveal className="mt-12" delay={0.1}>
            <Link
              to="/work"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-6 text-sm font-medium text-text transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-aurora-teal/50 hover:text-aurora-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              See every project
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
