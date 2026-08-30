import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Reveal, { Eyebrow } from '../components/Reveal';
import ExpandableProjectCard from './ExpandableProjectCard';
import { PROJECTS } from '../data/projects';
import { cn } from '../lib/utils';

/**
 * The solutions grid. `limit` lets the home page show a subset while /work shows the full
 * set from the same data source.
 *
 * Two columns, not three: at three across, a 1200px-wide landing-page screenshot renders
 * about 380px wide and every site collapses into the same dark-hero smudge. The screenshot
 * is the portfolio piece here, so it gets the width it needs to be read as one. Cards
 * expand to their full detail on hover, tap or focus; nothing links out to a client site.
 */
export default function WorkShowcase({ limit, showViewAll = false, className }) {
  const projects = limit ? PROJECTS.slice(0, limit) : PROJECTS;

  return (
    <section className={cn('relative py-section', className)}>
      <div className="mx-auto max-w-content px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>Selected solutions</Eyebrow>
          <h2 className="mt-5 font-display text-h2 font-bold text-text">
            Digital systems built for real operations.
          </h2>
          <p className="mt-4 text-body-lg text-text-dim">
            Explore a selection of digital solutions designed to support customer experiences,
            business operations, and the teams behind them. Every tile is a real screenshot of
            the live landing page. Hover or tap one to learn more.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal key={project.id} y={48} delay={i * 0.08} className="flex">
              {/* The first row is above the fold on /work, so those two screenshots are
                  fetched eagerly; the rest stay lazy. */}
              <ExpandableProjectCard project={project} priority={i < 2} className="w-full" />
            </Reveal>
          ))}
        </div>

        {showViewAll && (
          <Reveal className="mt-12" delay={0.1}>
            <Link
              to="/work"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line px-6 text-sm font-medium text-text transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-aurora-teal/50 hover:text-aurora-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Explore all solutions
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
