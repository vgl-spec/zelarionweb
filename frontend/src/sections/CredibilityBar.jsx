import React from 'react';
import Reveal from '../components/Reveal';

// The same six clients named in the hero, restated here as a plain-text
// strip. Deliberately not a logo carousel: there are no logo image files for
// these clients, and inventing marks or a rotating-loop treatment would read
// as decoration standing in for evidence. Names, set as type, are the proof.
const CLIENTS = [
  'Palattao Law Office',
  'Kaibo PH OPC',
  'Goldenstars Packaging Resources',
  'NOGATU Alliance',
  'Yor International',
  'Nogatu Store',
];

export default function CredibilityBar() {
  return (
    <section
      className="relative border-y border-line py-8"
      aria-label="Clients Zelarion has built for"
      data-testid="credibility-bar-section"
    >
      <div className="mx-auto max-w-content px-6">
        <Reveal className="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-text-dim">
            Real clients, real systems
          </span>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {CLIENTS.map((name) => (
              <li key={name} className="text-[15px] text-text-dim">
                {name}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
