import React from 'react';
import Reveal from '../components/Reveal';

export default function CredibilityBar() {
  return (
    <section
      className="relative border-y border-line py-8"
      aria-label="The kind of work Zelarion does"
      data-testid="credibility-bar-section"
    >
      <div className="mx-auto max-w-content px-6">
        <Reveal className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-text-dim">
            Real clients, real systems
          </span>
          <p className="max-w-2xl text-[15px] text-text-dim">
            Palattao Law Office and Kaibo PH OPC are two of the public sites we've built. Most of
            what we do is internal systems and custom software that stays behind the scenes,
            which is normal for a studio.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
