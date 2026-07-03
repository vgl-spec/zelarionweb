import React from 'react';
import { Check } from 'lucide-react';
import Reveal, { Eyebrow } from './Reveal';
import { Button } from './ui/button';
import { useDemo } from './DemoModal';

const TIERS = [
  {
    name: 'Team',
    price: '$49',
    unit: '/ developer / month',
    featured: false,
    features: [
      '25 seats',
      '50,000 runs per month',
      'Deterministic runs + flake detection',
      'PR verdicts in 90 seconds',
      'Email support',
    ],
    cta: 'Book a demo',
  },
  {
    name: 'Scale',
    price: '$89',
    unit: '/ developer / month',
    featured: true,
    features: [
      'Unlimited seats',
      '500,000 runs per month',
      'Everything in Team',
      'Priority runner grid',
      'Slack support with a 4-hour response time',
    ],
    cta: 'Book a demo',
  },
  {
    name: 'Enterprise',
    price: '$2,400',
    unit: '/ month flat',
    featured: false,
    features: [
      'Unlimited runs',
      'SSO + SCIM',
      'Dedicated support engineer',
      '99.98% uptime SLA',
      'Onboarding in 5 business days',
    ],
    cta: 'Book a demo',
  },
];

export default function Pricing() {
  const { openDemo } = useDemo();
  return (
    <section id="pricing" className="relative py-28 md:py-40" data-testid="pricing-section">
      <div className="mx-auto max-w-content px-6">
        <Reveal className="max-w-2xl">
          <Eyebrow>One price. Every number stated.</Eyebrow>
          <h2 className="mt-6 font-display text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.02] tracking-tightest text-text">
            Pricing without the asterisks.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 0.1}
              y={40}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                t.featured
                  ? 'border-aurora-cyan/40 bg-[linear-gradient(180deg,rgba(6,182,212,0.08),rgba(11,15,20,0.4))]'
                  : 'border-line bg-surface/40'
              }`}
              data-testid={`pricing-${t.name.toLowerCase()}`}
            >
              {t.featured && (
                <span className="absolute right-6 top-6 rounded-full border border-aurora-cyan/40 bg-aurora-cyan/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-aurora-cyan">
                  Most chosen
                </span>
              )}
              <h3 className="font-display text-xl font-bold tracking-tight text-text">{t.name}</h3>
              <div className="mt-6 flex items-baseline gap-2">
                <span
                  className={`tnum font-display text-5xl font-bold tracking-tightest ${
                    t.featured ? 'text-gradient' : 'text-text'
                  }`}
                >
                  {t.price}
                </span>
                <span className="text-sm text-text-dim">{t.unit}</span>
              </div>

              <ul className="mt-8 flex-1 space-y-3.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px] text-text">
                    <Check size={17} className="mt-0.5 shrink-0 text-aurora-teal" strokeWidth={2.4} />
                    <span className="tnum">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={t.featured ? 'solid' : 'outline'}
                size="lg"
                className="mt-10 w-full"
                onClick={openDemo}
                data-testid={`pricing-cta-${t.name.toLowerCase()}`}
              >
                {t.cta}
              </Button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
