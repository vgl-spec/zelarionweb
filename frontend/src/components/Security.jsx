import React from 'react';
import { Lock, KeyRound, Server, Users, Activity } from 'lucide-react';
import Reveal, { Eyebrow } from './Reveal';

const CLAIMS = [
  { icon: Lock, t: 'SOC 2 Type II certified', d: 'Audited controls, verified annually.' },
  {
    icon: KeyRound,
    t: 'AES-256, in transit and at rest',
    d: 'Every byte encrypted on both paths.',
  },
  {
    icon: Server,
    t: 'Source code is never stored',
    d: 'Runners are wiped after every run.',
  },
  { icon: Users, t: 'SSO and SCIM provisioning', d: 'On the Enterprise plan.' },
  {
    icon: Activity,
    t: '99.98% pipeline uptime',
    d: 'Backed by a status page updated every 60 seconds.',
  },
];

export default function Security() {
  return (
    <section
      id="company"
      className="relative border-t border-line py-28 md:py-40"
      data-testid="security-section"
    >
      <div className="mx-auto max-w-content px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>Built to be trusted</Eyebrow>
          <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.02] tracking-tightest text-text">
            Concrete guarantees. No filler.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
          {CLAIMS.map((c, i) => (
            <Reveal
              key={c.t}
              delay={(i % 2) * 0.08}
              className="flex gap-5 border-t border-line pt-8"
            >
              <c.icon size={22} className="mt-0.5 shrink-0 text-aurora-teal" strokeWidth={1.6} />
              <div>
                <h3 className="font-display text-lg font-bold tracking-tight text-text">{c.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-text-dim">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
