import React, { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn, prefersReducedMotion } from '../lib/utils';

// Matches the site's `ease-expensive` timing token (see tailwind.config.js
// `transitionTimingFunction.expensive`), kept here as a plain array because
// framer-motion's `transition.ease` takes a cubic-bezier tuple, not a CSS
// string.
const EASE_EXPENSIVE = [0.16, 1, 0.3, 1];

// Props-driven profile card: expands in place to reveal bio/stats/socials.
// Deliberately has no person baked in -- callers (e.g. TeamSection) own the
// content, this owns only the expand/collapse interaction.
export default function ExpandableProfileCard({
  name,
  role,
  bio,
  avatar,
  stats = [],
  socials = [],
  defaultExpanded = false,
  expanded,
  onExpandedChange,
  className,
}) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = expanded !== undefined;
  const isExpanded = isControlled ? expanded : internalExpanded;

  // Read once per render rather than subscribing to the media query -- the
  // card only needs to know the setting at the moment it animates, and a
  // live subscription would add a listener per card for no real benefit.
  const reduced = prefersReducedMotion();

  const uid = useId();
  const triggerId = `profile-trigger-${uid}`;
  const contentId = `profile-content-${uid}`;

  const handleToggle = () => {
    const next = !isExpanded;
    if (!isControlled) setInternalExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <motion.div
      layout
      transition={{ duration: reduced ? 0 : 0.4, ease: EASE_EXPENSIVE }}
      className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}
      data-testid="expandable-profile-card"
    >
      <button
        type="button"
        id={triggerId}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={handleToggle}
        className="flex w-full items-center gap-4 p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {avatar}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-lg font-semibold text-foreground">{name}</span>
          <span className="block text-sm text-muted-foreground">{role}</span>
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
            isExpanded && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            id={contentId}
            role="region"
            aria-labelledby={triggerId}
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.4, ease: EASE_EXPENSIVE }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-6 pb-6 pt-5">
              {bio && <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p>}

              {stats.length > 0 && (
                <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <dt className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{stat.label}</dt>
                      <dd className="mt-1 text-sm font-semibold text-foreground">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {socials.length > 0 && (
                <div className="mt-5 flex items-center gap-2">
                  {socials.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors duration-300 hover:border-white/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
