import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Reveal, { Eyebrow } from '../components/Reveal';
import { PROJECTS } from '../data/projects';
import { cn } from '../lib/utils';

function ProjectCard({ project }) {
  return (
    <figure
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface',
        // The border warm is the whole hover language here: colour only, 200ms on the UI
        // curve. The screenshot's own scale transform is set separately below.
        'transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'hover:border-aurora-teal/40'
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-line transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:bg-aurora-teal"
      />

      {/* Browser chrome — reads unambiguously as "a picture of a website", not a stock photo. */}
      <div
        aria-hidden="true"
        className="flex h-[34px] shrink-0 items-center gap-3 border-b border-line px-4"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-text-dim/30" />
          <span className="h-2 w-2 rounded-full bg-text-dim/30" />
          <span className="h-2 w-2 rounded-full bg-text-dim/30" />
        </span>
        <span className="font-mono text-[11px] text-text-dim">{project.domain}</span>
      </div>

      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={project.preview}
          alt={`Landing page of the ${project.name} website`}
          loading="lazy"
          decoding="async"
          width="1200"
          height="675"
          className="h-full w-full object-cover object-top transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.02]"
        />
      </div>

      <figcaption className="flex flex-1 flex-col gap-3 p-7">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-dim">
          {project.sector}
        </span>

        <h3 className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl">
          {project.name}
        </h3>

        <p className="line-clamp-4 text-sm leading-relaxed text-text-dim">{project.summary}</p>
      </figcaption>
    </figure>
  );
}

/**
 * The portfolio grid. `limit` lets the home page show a subset while /work shows all six
 * from the same data source. Cards are screenshot previews, not links — there is no
 * click-through to the client sites.
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
            Every site below belongs to a real business and is live today. Each preview is a
            real screenshot of its landing page, captured from the site as it ships.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal key={project.id} y={48} delay={i * 0.08} className="flex">
              <ProjectCard project={project} />
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
