import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Expand, X } from 'lucide-react';
import { lockScroll, unlockScroll } from '../lib/scrollStore';
import { cn, prefersReducedMotion } from '../lib/utils';

// Matches the site's `ease-expensive` timing token (see tailwind.config.js
// `transitionTimingFunction.expensive`), kept here as a plain array because
// framer-motion's `transition.ease` takes a cubic-bezier tuple, not a CSS
// string.
const EASE_EXPENSIVE = [0.16, 1, 0.3, 1];

// Open is deliberately slower than close -- growing into view can take its
// time, but dismissing a dialog should feel immediate.
const OPEN_SECONDS = 0.38;
const CLOSE_SECONDS = 0.28;
const REDUCED_SECONDS = 0.15;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
}

// Props-driven profile card. Collapsed, it's a grid tile; expanded, it's a
// shared-element overlay that grows out of that tile to dominate the
// viewport (not a full-screen takeover, not an in-place accordion). Callers
// (e.g. TeamSection) own the content, this owns only the open/close
// interaction, the shared layout animation, and dialog accessibility.
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
  const layoutId = `profile-card-${uid}`;
  const triggerId = `profile-trigger-${uid}`;
  const dialogId = `profile-dialog-${uid}`;
  const headingId = `profile-heading-${uid}`;

  const triggerRef = useRef(null);
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);

  const setExpanded = (next) => {
    if (!isControlled) setInternalExpanded(next);
    onExpandedChange?.(next);
  };
  const handleToggle = () => setExpanded(!isExpanded);

  // Dialog behaviour while open: lock body scroll, move focus into the
  // card, trap Tab inside it, close on Escape, and give focus back to the
  // trigger that opened it on the way out.
  useEffect(() => {
    if (!isExpanded) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const triggerEl = triggerRef.current;
    // Both levers are needed: Lenis drives scrolling through its own rAF loop
    // and ignores body overflow, and under reduced motion there is no Lenis to
    // pause, so overflow is the only lever. Neither alone holds the page still.
    document.body.style.overflow = 'hidden';
    lockScroll();
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setExpanded(false);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      unlockScroll();
      triggerEl?.focus();
    };
  }, [isExpanded]);

  // Bio/stats/socials fade in just after the shared-layout move settles
  // (hence the delay past OPEN_SECONDS), so content doesn't render mid-flight.
  const contentTransition = reduced
    ? { duration: REDUCED_SECONDS, ease: 'linear' }
    : { duration: 0.24, ease: EASE_EXPENSIVE, delay: 0.16 };

  return (
    <div className={cn('rounded-xl border border-border bg-card', className)} data-testid="expandable-profile-card">
      <motion.button
        ref={triggerRef}
        layoutId={reduced ? undefined : layoutId}
        type="button"
        id={triggerId}
        aria-expanded={isExpanded}
        aria-controls={dialogId}
        onClick={handleToggle}
        className="group flex w-full items-center gap-4 rounded-xl p-6 text-left transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {avatar}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-lg font-semibold text-foreground">{name}</span>
          <span className="block text-sm text-muted-foreground">{role}</span>
        </span>
        <Expand
          className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110"
          aria-hidden="true"
        />
        <span className="sr-only">View profile</span>
      </motion.button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isExpanded && (
              <React.Fragment key="overlay">
                <motion.div
                  className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm"
                  onClick={() => setExpanded(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: reduced ? REDUCED_SECONDS : OPEN_SECONDS, ease: EASE_EXPENSIVE } }}
                  exit={{ opacity: 0, transition: { duration: reduced ? REDUCED_SECONDS : CLOSE_SECONDS, ease: EASE_EXPENSIVE } }}
                  aria-hidden="true"
                />

                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    ref={dialogRef}
                    layoutId={reduced ? undefined : layoutId}
                    id={dialogId}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={headingId}
                    initial={reduced ? { opacity: 0 } : false}
                    animate={{
                      opacity: 1,
                      transition: reduced
                        ? { duration: REDUCED_SECONDS, ease: EASE_EXPENSIVE }
                        : { layout: { duration: OPEN_SECONDS, ease: EASE_EXPENSIVE } },
                    }}
                    exit={{
                      opacity: reduced ? 0 : 1,
                      transition: reduced
                        ? { duration: REDUCED_SECONDS, ease: EASE_EXPENSIVE }
                        : { layout: { duration: CLOSE_SECONDS, ease: EASE_EXPENSIVE } },
                    }}
                    className="flex max-h-[85vh] w-[min(92vw,42rem)] flex-col overflow-y-auto rounded-2xl border border-border bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]"
                  >
                    <div className="flex items-start gap-4 p-6 sm:p-8">
                      {avatar}
                      <span className="min-w-0 flex-1">
                        <span id={headingId} className="block font-display text-2xl font-semibold text-foreground">
                          {name}
                        </span>
                        <span className="block text-sm text-muted-foreground">{role}</span>
                      </span>
                      <button
                        ref={closeButtonRef}
                        type="button"
                        aria-label="Close profile"
                        onClick={() => setExpanded(false)}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    <motion.div
                      initial={reduced ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={contentTransition}
                      className="border-t border-border px-6 pb-8 pt-6 sm:px-8"
                    >
                      {bio && <p className="text-sm leading-relaxed text-muted-foreground">{bio}</p>}

                      {stats.length > 0 && (
                        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                          {stats.map((stat, index) => (
                            <motion.div
                              key={stat.label}
                              initial={reduced ? false : { opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                ...contentTransition,
                                delay: reduced ? 0 : contentTransition.delay + index * 0.04,
                              }}
                            >
                              <dt className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
                                {stat.label}
                              </dt>
                              <dd className="mt-1 text-sm font-semibold text-foreground">{stat.value}</dd>
                            </motion.div>
                          ))}
                        </dl>
                      )}

                      {socials.length > 0 && (
                        <div className="mt-6 flex items-center gap-2">
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
                    </motion.div>
                  </motion.div>
                </div>
              </React.Fragment>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
