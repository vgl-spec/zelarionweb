import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Reveal, { Eyebrow } from '../components/Reveal';
import ExpandableProjectCard from './ExpandableProjectCard';
import { PROJECTS } from '../data/projects';
import { cn } from '../lib/utils';

/**
 * The project grid reads from the same data source on the home page and /work. Its
 * single-project state uses a centered width so the landing-page screenshot stays readable.
 */
export default function WorkShowcase({ limit, showViewAll = false, className }) {
  const projects = limit ? PROJECTS.slice(0, limit) : PROJECTS;
  const isSingleProject = projects.length === 1;

  return (
    <section className={cn('relative py-section', className)}>
      <div className="mx-auto max-w-content px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>Featured project</Eyebrow>
          <h2 className="mt-5 font-display text-h2 font-bold text-text">
            Custom internal systems built for real operations.
          </h2>
          <p className="mt-4 text-body-lg text-text-dim">
            Explore Zelarion’s work with Kaibo PH OPC. We built custom internal systems to support
            the day-to-day work behind its client-facing web presence. The tile is a current
            landing-page capture; hover or tap to learn more.
          </p>
        </Reveal>

        <div
          className={cn(
            'mt-14 grid gap-6',
            isSingleProject ? 'mx-auto max-w-3xl' : 'md:grid-cols-2'
          )}
        >
          {projects.map((project, i) => (
            <Reveal key={project.id} y={48} delay={i * 0.08} className="flex">
              <ExpandableProjectCard project={project} priority={i === 0} className="w-full" />
            </Reveal>
          ))}
        </div>

        {showViewAll && (
          <Reveal className="mt-12" delay={0.1}>
            <Link
              to="/work"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-6 text-sm font-medium text-text transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-aurora-teal/50 hover:text-aurora-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              View project
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
