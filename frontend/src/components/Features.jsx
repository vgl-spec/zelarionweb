import React from 'react';
import { Fingerprint, ShieldAlert, Terminal, Check } from 'lucide-react';
import Reveal, { Eyebrow } from './Reveal';

/* --- bespoke product visuals (no stock, no generic cards) --- */

function DeterministicVisual() {
  const rows = ['runtime', 'dependencies', 'seed', 'environment'];
  return (
    <div className="relative rounded-2xl border border-line bg-surface/60 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-xs text-text-dim">
        <Fingerprint size={15} className="text-aurora-teal" />
        run fingerprint
      </div>
      <div className="mt-5 space-y-2.5">
        {rows.map((r, i) => (
          <div
            key={r}
            className="flex items-center justify-between rounded-lg border border-line bg-ink/60 px-4 py-3"
          >
            <span className="text-sm text-text">{r}</span>
            <span className="tnum text-[13px] text-text-dim">
              {['a1f4', '9c02', '3de7', 'b8a0'][i]}·locked
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <span className="text-xs text-text-dim">verdict hash</span>
        <span className="tnum text-sm text-gradient">0xVERIFIED</span>
      </div>
    </div>
  );
}

function FlakeVisual() {
  return (
    <div className="relative rounded-2xl border border-line bg-surface/60 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs text-text-dim">
          <ShieldAlert size={15} className="text-aurora-indigo" />
          quarantine
        </span>
        <span className="rounded-full border border-aurora-indigo/40 bg-aurora-indigo/10 px-2.5 py-0.5 text-[11px] text-aurora-indigo">
          3 inconsistent runs
        </span>
      </div>
      <div className="mt-6 space-y-3">
        {[
          { n: 'checkout.spec', s: 'quarantined', bad: true },
          { n: 'payments.spec', s: '10 clean · reinstated', bad: false },
          { n: 'auth.spec', s: 'stable', bad: false },
        ].map((t) => (
          <div key={t.n} className="flex items-center gap-3">
            <span
              className={`h-2 w-2 rounded-full ${
                t.bad ? 'bg-aurora-indigo' : 'bg-aurora-teal'
              }`}
            />
            <span className="flex-1 text-sm text-text">{t.n}</span>
            <span className="text-[12px] text-text-dim">{t.s}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-ink">
        <div className="h-full w-[70%] bg-[linear-gradient(90deg,#2DD4C4,#6366F1)]" />
      </div>
      <p className="mt-2 text-[12px] text-text-dim">reproduction trace attached</p>
    </div>
  );
}

function IntegrationVisual() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-[#07090d] font-mono">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="ml-2 text-[12px] text-text-dim">.github/workflows/ci.yml</span>
      </div>
      <div className="space-y-1.5 p-5 text-[13px] leading-relaxed">
        <div className="text-text-dim">steps:</div>
        <div className="pl-4 text-text">
          <span className="text-text-dim">- uses: </span>
          <span className="text-gradient">zelarion/verify@v1</span>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-aurora-teal/25 bg-aurora-teal/[0.06] px-3 py-2.5 text-aurora-teal">
          <Check size={15} strokeWidth={2.5} />
          <span className="text-[13px]">verdict posted to PR · 90 sec</span>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Terminal,
    eyebrow: '01',
    title: 'Deterministic runs',
    lines: [
      'Same input, same verdict, every time.',
      'Zelarion pins the runtime, dependency tree, and seed per run — no "works locally" surprises.',
    ],
    Visual: DeterministicVisual,
  },
  {
    icon: ShieldAlert,
    eyebrow: '02',
    title: 'Flake detection',
    lines: [
      'Zelarion quarantines a flaky test automatically after 3 inconsistent runs.',
      'It rejoins the suite the moment it passes 10 consecutive times — with a full reproduction trace.',
    ],
    Visual: FlakeVisual,
  },
  {
    icon: Fingerprint,
    eyebrow: '03',
    title: 'One-line integration',
    lines: [
      'Drop the Zelarion action into your CI config.',
      'Results post to your pull request in 90 seconds, with a line-by-line diff of what passed and why.',
    ],
    Visual: IntegrationVisual,
  },
];

export default function Features() {
  return (
    <section id="solutions" className="relative py-28 md:py-40" data-testid="features-section">
      <div className="mx-auto max-w-content px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>What Zelarion does</Eyebrow>
          <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.02] tracking-tightest text-text">
            Three disciplines. One verdict.
          </h2>
        </Reveal>

        <div className="mt-24 space-y-28 md:space-y-40">
          {FEATURES.map((f, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={f.title}
                className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16"
              >
                <Reveal
                  y={36}
                  className={`lg:col-span-5 ${reversed ? 'lg:order-2 lg:col-start-8' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="tnum text-sm text-text-dim">{f.eyebrow}</span>
                    <span className="h-px flex-1 bg-line" />
                    <f.icon size={18} className="text-aurora-teal" />
                  </div>
                  <h3 className="mt-6 font-display text-[clamp(1.75rem,3vw,2.75rem)] font-bold leading-tight tracking-tightest text-text">
                    {f.title}
                  </h3>
                  <p className="mt-5 text-lg leading-relaxed text-text">{f.lines[0]}</p>
                  <p className="mt-3 text-base leading-relaxed text-text-dim">{f.lines[1]}</p>
                </Reveal>

                <Reveal
                  y={44}
                  delay={0.1}
                  className={`lg:col-span-6 ${reversed ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-7'}`}
                >
                  <f.Visual />
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
