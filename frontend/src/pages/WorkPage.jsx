import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Reveal, { Eyebrow } from '../components/Reveal';
import WorkShowcase from '../sections/WorkShowcase';

export default function WorkPage() {
  return (
    <>
      <section className="relative pb-8 pt-32 sm:pt-40">
        <div className="mx-auto max-w-content px-6">
          <Reveal>
            <Eyebrow>Work</Eyebrow>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold tracking-tightest text-text sm:text-6xl">
              Six businesses, six systems in production.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-dim">
              A law firm, an industrial supplier, a packaging manufacturer, a wellness
              organisation and two commerce platforms. Different sectors, the same standard
              of build.
            </p>
          </Reveal>
        </div>
      </section>

      <WorkShowcase className="pt-4" />

      <section className="pb-section">
        <div className="mx-auto max-w-content px-6">
          <Reveal className="rounded-2xl border border-line bg-surface p-10 sm:p-14">
            <h2 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Have something similar in mind?
            </h2>
            <p className="mt-3 max-w-xl text-text-dim">
              Tell us what the business needs to do. We will tell you what it takes to build.
            </p>
            <Link
              to="/contact"
              className="mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-aurora-teal px-7 text-sm font-semibold text-ink transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Start a project
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
