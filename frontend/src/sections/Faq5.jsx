import React from 'react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { cn } from '../lib/utils';

// AccordionItem `value`s must be unique across the *whole page*, not just
// within one category -- Radix's single-collapsible Accordion tracks open
// state by value alone, so two categories both emitting "item-0" would open
// and close together instead of independently. Slugging the category title
// into the value namespaces every item to its own category.
function toSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function Faq5({ categories, className }) {
  return (
    <section className={cn('py-24 md:py-32', className)} data-testid="faq5-section">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-20">
          {categories.map((category) => {
            const categorySlug = toSlug(category.title);
            return (
              <div key={category.title} className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-16">
                <div className="lg:col-span-4">
                  <div className="lg:sticky lg:top-24">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                      {category.title}
                    </h2>
                    {category.description && (
                      <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {category.description}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, itemIndex) => (
                      <AccordionItem key={`${categorySlug}-${itemIndex}`} value={`${categorySlug}-${itemIndex}`}>
                        <AccordionTrigger className="text-lg font-medium hover:text-primary hover:no-underline md:text-xl">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Zelarion-specific copy for the default FAQ instance. Written for what this
// repo actually is -- a React/Tailwind frontend on a Node/Express + MongoDB
// backend -- not a port of any reference site's stack.
export const zelarionFaqCategories = [
  {
    title: 'Working with Zelarion',
    description: (
      <>
        Still deciding if we're the right fit?{' '}
        <Link to="/contact" className="text-primary underline underline-offset-4 hover:text-primary/80">
          Tell us about your project
        </Link>{' '}
        and we'll reply with a straight answer.
      </>
    ),
    items: [
      {
        question: 'What does Zelarion actually build?',
        answer:
          'Full products, not just mockups: React and Tailwind on the frontend, a Node/Express and MongoDB backend when the project needs one, wired together and shipped -- not handed off as a design file.',
      },
      {
        question: 'How is a typical engagement scoped?',
        answer:
          'We start with a short discovery pass to pin down what "done" looks like, then propose either a fixed-scope project with milestones or a monthly retainer for ongoing work, whichever matches how the work actually shows up.',
      },
      {
        question: 'Do you work with early-stage startups, or only established companies?',
        answer:
          'Both. Early-stage teams usually need an MVP built fast and cheaply enough to iterate on; established teams usually need a specific feature, redesign, or a codebase taken over cleanly. We scope each differently.',
      },
      {
        question: 'Who owns the code and the accounts?',
        answer:
          'You do. The repository, the domain, the hosting and the database accounts are yours and stay in your name -- we work inside them rather than holding them hostage. Handover is part of delivery, not an upsell.',
      },
      {
        question: 'How does pricing work?',
        answer:
          'A fixed price against an agreed scope, quoted after a short discovery conversation. We do not quote before understanding what the system has to do, because a number produced without that is a guess that one of us pays for later.',
      },
      {
        question: 'You are based in the Philippines. How does that work if we are not?',
        answer:
          'We work asynchronously by default and keep a written trail, so progress does not depend on being awake at the same time. We hold overlapping hours for calls and agree those before the project starts.',
      },
      {
        question: "What's your typical turnaround for an MVP?",
        answer:
          'Weeks, not months, for a focused first version -- the exact number depends on scope, but we agree on a timeline before any code is written, not after.',
      },
    ],
  },
  {
    title: 'Process & Technology',
    description: (
      <>
        Want the specifics before you commit?{' '}
        <Link to="/contact" className="text-primary underline underline-offset-4 hover:text-primary/80">
          Ask us directly
        </Link>{' '}
        -- we'd rather answer up front than surprise you later.
      </>
    ),
    items: [
      {
        question: "What's your tech stack?",
        answer:
          'React 18 with Tailwind CSS on the frontend, and a Node/Express API backed by MongoDB when the product needs persistent data. We pick boring, well-supported tools on purpose -- your team should be able to hire for this stack later.',
      },
      {
        question: 'Do you handle design as well as engineering?',
        answer:
          'Yes -- UI/UX design happens in-house alongside engineering, so the interface and the implementation are designed together instead of translated across a handoff.',
      },
      {
        question: 'How do you handle revisions after launch?',
        answer:
          'Every project ships with a short included revision window. After that, ongoing changes and maintenance run through a lightweight support retainer, billed only for the hours actually used.',
      },
      {
        question: 'Can you take over an existing codebase?',
        answer:
          "Usually, yes. We start with a short paid audit to understand what's there and flag anything that would make a takeover risky before committing to a timeline or quote.",
      },
    ],
  },
];

export default Faq5;
