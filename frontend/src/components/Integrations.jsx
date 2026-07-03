import React from 'react';
import Reveal, { Eyebrow } from './Reveal';

const GROUPS = [
  { label: 'Version control', items: ['GitHub', 'GitLab', 'Bitbucket'] },
  { label: 'CI', items: ['GitHub Actions', 'CircleCI', 'Jenkins', 'Buildkite', 'GitLab CI'] },
  {
    label: 'Languages & runtimes',
    items: ['Node', 'Python', 'Go', 'Ruby', 'Java', 'Rust', 'PHP', '.NET'],
  },
  {
    label: 'Test frameworks',
    items: ['Jest', 'Vitest', 'Playwright', 'Cypress', 'PyTest', 'RSpec', 'JUnit', 'Go test'],
  },
  { label: 'Alerts', items: ['Slack', 'Microsoft Teams', 'PagerDuty', 'Linear', 'Jira'] },
];

export default function Integrations() {
  return (
    <section className="relative py-28 md:py-40" data-testid="integrations-section">
      <div className="mx-auto max-w-content px-6">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <Reveal className="max-w-xl">
            <Eyebrow>Coverage</Eyebrow>
            <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.02] tracking-tightest text-text">
              <span className="tnum text-gradient">38</span> integrations,
              <br />
              live today.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="max-w-sm text-base leading-relaxed text-text-dim">
            Zero-config across every stack a team ships with — from version control to
            the frameworks your suite already runs on.
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 lg:grid-cols-5">
          {GROUPS.map((g, i) => (
            <Reveal key={g.label} delay={i * 0.06} className="bg-ink p-6">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-text-dim">
                {g.label}
              </p>
              <ul className="mt-4 space-y-2.5">
                {g.items.map((it) => (
                  <li key={it} className="flex items-center gap-2.5 text-[15px] text-text">
                    <span className="h-1.5 w-1.5 rounded-full bg-aurora-teal/70" />
                    {it}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
