import React from 'react';
import Reveal from '../components/Reveal';

export default function CredibilityBar() {
  return (
    <section
      className="relative border-y border-line py-8"
      aria-label="The digital solutions Zelarion creates"
      data-testid="credibility-bar-section"
    >
      <div className="mx-auto max-w-content px-6">
        <Reveal className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-text-dim">
            Built for the operational edge
          </span>
          <p className="max-w-2xl text-[15px] text-text-dim">
            From public digital experiences to the software teams use every day, we turn complex
            business needs into clear, dependable digital systems.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
