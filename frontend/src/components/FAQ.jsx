import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Reveal, { Eyebrow } from './Reveal';

const FAQS = [
  { q: 'How fast is a verdict?', a: '90 seconds on average, measured across the full suite.' },
  {
    q: 'What if a test is flaky?',
    a: "It's quarantined automatically after 3 inconsistent runs and reinstated after 10 clean ones.",
  },
  { q: 'How long is setup?', a: 'One line in your CI config. Teams are live the same day.' },
  {
    q: 'Do you store our source code?',
    a: 'No. Runners are wiped after every run; code is never persisted.',
  },
  {
    q: 'Which stacks are supported?',
    a: '38 integrations across version control, CI, languages, and test frameworks — live today.',
  },
  {
    q: 'Is there an uptime guarantee?',
    a: '99.98%, backed by a public status page and an SLA on the Enterprise plan.',
  },
];

function Item({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line" data-testid={`faq-item-${index}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-lg font-medium tracking-tight text-text">{q}</span>
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            open ? 'rotate-45 border-aurora-cyan/50 text-aurora-cyan' : 'text-text-dim'
          }`}
        >
          <Plus size={16} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-text-dim">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  return (
    <section className="relative py-28 md:py-40" data-testid="faq-section">
      <div className="mx-auto grid max-w-content grid-cols-1 gap-12 px-6 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-4">
          <Eyebrow>Questions</Eyebrow>
          <h2 className="mt-6 font-display text-[clamp(2rem,3.5vw,3rem)] font-bold leading-[1.02] tracking-tightest text-text">
            Answered, without hedging.
          </h2>
        </Reveal>
        <div className="lg:col-span-7 lg:col-start-6">
          {FAQS.map((f, i) => (
            <Item key={f.q} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
