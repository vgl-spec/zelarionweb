import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import Reveal, { Eyebrow } from './Reveal';

const STATS = [
  { value: 12400, suffix: '', label: 'tests executed per minute', decimals: 0, format: 'comma' },
  { value: 99.98, suffix: '%', label: 'pipeline uptime', decimals: 2 },
  { value: 90, prefix: '', suffix: ' sec', label: 'average verdict time', decimals: 0 },
  { value: 38, suffix: '', label: 'integrations, live today', decimals: 0 },
];

function Stat({ value, decimals = 0, prefix = '', suffix = '', format }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        let out;
        if (format === 'comma') out = Math.round(v).toLocaleString('en-US');
        else out = v.toFixed(decimals);
        setDisplay(out);
      },
    });
    return () => controls.stop();
  }, [inView, value, decimals, format]);

  return (
    <span ref={ref} className="tnum text-gradient">
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

export default function Metrics() {
  return (
    <section className="relative border-y border-line py-24 md:py-32" data-testid="metrics-section">
      <div className="mx-auto max-w-content px-6">
        <Reveal>
          <Eyebrow>The verdict, in numbers</Eyebrow>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 0.08}
              className="bg-ink p-8 transition-colors duration-500 hover:bg-surface"
              data-testid={`stat-tile-${i}`}
            >
              <div className="font-display text-[clamp(2.5rem,4.5vw,3.75rem)] font-bold leading-none tracking-tightest">
                <Stat {...s} />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-text-dim">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
