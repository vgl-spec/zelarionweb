import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Reveal, { Eyebrow } from '../components/Reveal';
import Seo from '../components/Seo';

/**
 * The only surface that names the people behind Zelarion.
 *
 * Reached at /team by typing the URL: it is deliberately absent from the header, the
 * footer and the sitemap, so nothing on the site links here. That is a routing decision,
 * not a security one — the page is public to anyone who knows the path, and its markup is
 * in the shipped bundle. Treat it as unlisted, never as private.
 *
 * The roster lives here rather than in `public/index.html` because that file is served for
 * every route: naming people there would assert them on pages where they appear nowhere,
 * which is the "marked-up content is not visible to readers" pattern Google's structured
 * data guidelines call out. `TEAM_JSON_LD` below reuses the site-wide Organization `@id`
 * so the two graphs describe one entity rather than two.
 */
export const TEAM = [
  { name: 'Vergel A. Bautista', role: 'Chief Executive Officer', short: 'CEO' },
  { name: 'Jeremiah A. Villaret', role: 'Chief Technology Officer', short: 'CTO' },
  { name: 'Lara Aaliyah L. Quinto', role: 'Human Resources and Accounting', short: 'HR & Accounting' },
  { name: 'Jon Cristian R. Rivella', role: 'Marketing', short: 'Marketing' },
];

const ORGANIZATION_ID = 'https://www.zelarion.tech/#organization';

export const TEAM_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: 'Zelarion',
  url: 'https://www.zelarion.tech/',
  founder: {
    '@type': 'Person',
    name: TEAM[0].name,
    jobTitle: TEAM[0].role,
  },
  employee: TEAM.map((person) => ({
    '@type': 'Person',
    name: person.name,
    jobTitle: person.role,
  })),
};

/** Initials for the placeholder avatar, e.g. "Vergel A. Bautista" -> "VB". */
function initialsOf(name) {
  const parts = name.split(' ').filter((part) => !part.endsWith('.'));
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TeamPage() {
  return (
    <>
      {/* Rendered here rather than from App's route table so the names never leave this
          lazily-loaded chunk. `noIndex` keeps the people named below out of search: a name
          is slow and unreliable to remove from an index once crawled, so staying out is
          the reversible default. */}
      <Seo
        title="The people behind the work"
        description="The small team in Caloocan City building websites, commerce platforms and internal systems for businesses in the Philippines and abroad."
        path="/team"
        jsonLd={TEAM_JSON_LD}
        noIndex
      />

      <section className="relative pb-4 pt-32 sm:pt-40">
        <div className="mx-auto max-w-content px-6">
          <Reveal>
            <Eyebrow>The studio</Eyebrow>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold tracking-tightest text-text sm:text-6xl">
              The people behind the work.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-dim">
              A small team in Caloocan City building websites, commerce platforms and
              internal systems for businesses in the Philippines and abroad.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-section pt-12">
        <div className="mx-auto max-w-content px-6">
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {TEAM.map((person) => (
              <li key={person.name}>
                <Reveal className="flex h-full items-center gap-5 rounded-2xl border border-line bg-surface p-6 sm:p-8">
                  {/* Stands in for a portrait until real photography exists. Decorative:
                      the name is already the accessible label, right beside it. */}
                  <span
                    aria-hidden="true"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line bg-ink font-display text-base font-bold text-text-dim"
                  >
                    {initialsOf(person.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-lg font-bold leading-tight text-text">
                      {person.name}
                    </span>
                    <span className="mt-1 block font-mono text-eyebrow uppercase tracking-[0.18em] text-text-dim">
                      {person.short}
                    </span>
                  </span>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="pb-section">
        <div className="mx-auto max-w-content px-6">
          <Reveal className="rounded-2xl border border-line bg-surface p-10 sm:p-14">
            <h2 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Want to work with us?
            </h2>
            <p className="mt-3 max-w-xl text-text-dim">
              Tell us what you are trying to run better. You will hear back within one
              business day.
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-aurora-teal px-7 text-sm font-semibold text-ink transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Start a project
              <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
