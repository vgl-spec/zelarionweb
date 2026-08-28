import React, { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn, prefersReducedMotion } from '../lib/utils';

// The site's `ease-expensive` token, as a cubic-bezier tuple because
// framer-motion's `transition.ease` takes an array, not a CSS string.
const EASE_EXPENSIVE = [0.16, 1, 0.3, 1];

// Long enough that sweeping the pointer across the grid on the way somewhere
// else does not open every card it crosses; short enough to feel immediate
// when the pointer actually settles.
const HOVER_INTENT_MS = 90;

/**
 * True when the device has a real hovering pointer. Touch screens report
 * `hover: none`, and binding hover there produces a card that opens on tap and
 * then never closes. Subscribed rather than read once, because a tablet with a
 * trackpad attached can change the answer mid-session.
 */
function useCanHover() {
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setCanHover(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return canHover;
}

/**
 * A project preview that expands to reveal its full detail.
 *
 * Opens on hover where there is a pointer, on tap where there is not, and on
 * keyboard focus either way. It deliberately expands IN PLACE rather than into
 * a centred modal: a modal that opens on hover cannot be dismissed by moving
 * the mouse, traps focus the user never asked to give up, and makes the grid
 * impossible to cross. The toggle button stays a real button so the same
 * interaction is reachable by click, tap and Enter.
 */
export default function ExpandableProjectCard({ project, priority = false, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const reduced = prefersReducedMotion();
  const canHover = useCanHover();

  const uid = useId();
  const panelId = `project-panel-${uid}`;
  const triggerId = `project-trigger-${uid}`;

  const openTimer = useRef(0);
  const clearOpenTimer = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = 0;
    }
  };
  useEffect(() => clearOpenTimer, []);

  const handlePointerEnter = () => {
    if (!canHover) return;
    clearOpenTimer();
    openTimer.current = setTimeout(() => setIsOpen(true), HOVER_INTENT_MS);
  };

  const handlePointerLeave = () => {
    if (!canHover) return;
    clearOpenTimer();
    setIsOpen(false);
  };

  // Keyboard parity with hover: tabbing to the card reveals the same detail a
  // pointer user gets for free.
  //
  // Gated on :focus-visible, which is load-bearing rather than cosmetic. A tap
  // focuses the button and THEN clicks it, so an unconditional focus-opens
  // handler queued `open` and the click's toggle immediately flipped it back —
  // the card could never be opened by tapping at all. :focus-visible is false
  // for pointer/touch focus and true for keyboard focus, which is precisely the
  // distinction needed.
  const handleFocus = (event) => {
    try {
      if (event.target.matches(':focus-visible')) setIsOpen(true);
    } catch {
      // Browsers without :focus-visible support fall back to click/hover only.
    }
  };

  // Only collapse when focus actually leaves the card, not when it moves
  // between elements inside it.
  const handleBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
  };

  return (
    <figure
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface',
        'transition-[transform,border-color] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
        'hover:-translate-y-1 hover:border-aurora-teal/40 focus-within:border-aurora-teal/40',
        className
      )}
      data-testid="expandable-project-card"
      data-expanded={isOpen}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-10 h-px bg-line transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:bg-aurora-teal"
      />

      {/* Browser chrome — reads unambiguously as "a picture of a website". */}
      <div
        aria-hidden="true"
        className="flex h-[34px] shrink-0 items-center gap-3 border-b border-line px-4"
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-text-dim/30" />
          <span className="h-2 w-2 rounded-full bg-text-dim/30" />
          <span className="h-2 w-2 rounded-full bg-text-dim/30" />
        </span>
        <span className="font-mono text-[11px] text-text-dim">{project.domain}</span>
      </div>

      <div className="aspect-[16/9] overflow-hidden">
        <img
          src={project.preview}
          alt={`Landing page of the ${project.name} website`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          width="1200"
          height="675"
          className="h-full w-full object-cover object-top transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
        />
      </div>

      <figcaption className="flex flex-1 flex-col p-7">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-dim">
          {project.sector}
        </span>

        <button
          type="button"
          id={triggerId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
          className="mt-3 flex w-full items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-teal focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
        >
          <span className="font-display text-xl font-bold tracking-tight text-text sm:text-2xl">
            {project.name}
          </span>
          <ChevronDown
            className={cn(
              'mt-1 h-5 w-5 shrink-0 text-text-dim transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
          <span className="sr-only">{isOpen ? 'Hide project detail' : 'Show project detail'}</span>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="panel"
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              // Animating one grid track needs no per-frame height measurement,
              // unlike `height: auto`, which forces a reflow of the whole grid
              // on every frame. Collapse is quicker than expand so dismissing
              // feels responsive.
              initial={reduced ? false : { gridTemplateRows: '0fr', opacity: 0 }}
              animate={{ gridTemplateRows: '1fr', opacity: 1 }}
              exit={reduced ? { gridTemplateRows: '1fr', opacity: 1 } : { gridTemplateRows: '0fr', opacity: 0 }}
              transition={{
                gridTemplateRows: { duration: reduced ? 0 : 0.34, ease: EASE_EXPENSIVE },
                opacity: { duration: reduced ? 0 : 0.22, ease: EASE_EXPENSIVE },
              }}
              style={{ display: 'grid' }}
              className="overflow-hidden"
            >
              <div className="min-h-0 overflow-hidden">
                <p className="pt-3 text-sm leading-relaxed text-text-dim">{project.summary}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </figcaption>
    </figure>
  );
}
