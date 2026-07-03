import React from 'react';
import Reveal, { Eyebrow } from './Reveal';

const STEPS = [
  { n: '01', t: 'Connect', d: 'Add the Zelarion action to your CI in one line.' },
  { n: '02', t: 'Commit', d: 'Push code as normal. Zelarion picks up the commit instantly.' },
  { n: '03', t: 'Run', d: 'The full suite executes across the distributed runner grid.' },
  { n: '04', t: 'Verdict', d: 'A pass/fail result posts to the PR in 90 seconds.' },
];

export default function HowItWorks() {
  return (
    <section className="relative border-t border-line py-28 md:py-40" data-testid="how-section">
      <div className="mx-auto max-w-content px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>Four steps to a verdict</Eyebrow>
          <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.02] tracking-tightest text-text">
            From commit to verdict.
          </h2>
        </Reveal>

        <div className="mt-20 grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-8">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08} className="relative">
              <div className="flex items-center gap-4">
                <span className="tnum font-display text-4xl font-bold text-gradient">{s.n}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-text">
                {s.t}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-text-dim">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
