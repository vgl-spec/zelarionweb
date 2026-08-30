import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn, prefersReducedMotion } from '../lib/utils';

// The site's `ease-expensive` token, as a cubic-bezier tuple because
// framer-motion's `transition.ease` takes an array, not a CSS string.
const EASE_EXPENSIVE = [0.16, 1, 0.3, 1];
const OPEN_SECONDS = 0.4;
const CLOSE_SECONDS = 0.26;
const REDUCED_SECONDS = 0.15;

// Long enough that the preview is a deliberate act rather than something the pointer
// collects on its way across the grid.
const HOVER_INTENT_MS = 650;

// A click is an explicit request, so it skips the delay AND most of the entrance: played
// at the hover duration, a deliberate click feels like the card is thinking about it.
const CLICK_OPEN_SECONDS = 0.16;

// How long after the last scroll event a hover is allowed to count. Lenis keeps emitting
// for the length of its own inertia, so this is measured from when the page came to rest,
// not from when the wheel stopped. It covers the one case the movement test cannot: a
// trackpad scroll where the cursor drifts a few pixels at the same time.
const SCROLL_QUIET_MS = 300;

// The preview opens under the pointer's original position, which is over the
// grid card and therefore over the backdrop. Without a grace window the very
// next mouse movement would dismiss it before it finished animating in.
const DISMISS_GRACE_MS = 500;

// Closing removes the backdrop from under the cursor, and the browser then fires
// mouseenter on whatever is newly topmost, which is the tile that opened the
// preview. Left alone, Escape and the close button both appeared to do nothing:
// they closed the preview and that synthetic mouseenter reopened it instantly.
//
// The discriminator is movement. A synthetic mouseenter arrives with no
// mousemove behind it; a person hovering the tile always moves the pointer
// first. So a reopen requires a real mousemove logged after the last dismissal.
// A time window was tried first and is the wrong tool: too short and the second
// synthetic event slips through, too long and it swallows a deliberate re-hover.

/**
 * True when the device has a real hovering pointer. Touch screens report
 * `hover: none`, where hover-to-open would fire on tap and hover-to-dismiss
 * would never fire at all. Subscribed rather than read once, because a tablet
 * with a trackpad attached can change the answer mid-session.
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
 * A project preview that pops up into a wide overlay card.
 *
 * Opens on hover where there is a pointer and on tap where there is not, and
 * lifts into place. It dismisses on pointer-out, on Escape, on a backdrop
 * click, and from its own close button, so no single one of those is
 * load-bearing.
 *
 * Deliberately does NOT lock page scroll the way a form dialog would. This is a
 * preview the visitor glanced at, not a task they committed to, so the page
 * remains scrollable while it is open. In particular, Lenis momentum scroll
 * must not dismiss a preview immediately after its hover intent resolves.
 */
export default function ExpandableProjectCard({ project, priority = false, className }) {
  const [isOpen, setIsOpen] = useState(false);
  const reduced = prefersReducedMotion();
  const canHover = useCanHover();

  const uid = useId();
  const triggerId = `project-trigger-${uid}`;
  const dialogId = `project-dialog-${uid}`;
  const headingId = `project-heading-${uid}`;

  const triggerRef = useRef(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const openTimer = useRef(0);
  const openedAt = useRef(0);
  const dismissedAt = useRef(0);
  const lastPointerMoveAt = useRef(0);
  const lastScrollAt = useRef(0);
  const pointerPos = useRef({ x: -1, y: -1 });
  const hasMovedSinceEnter = useRef(false);
  const isPointerOnDialog = useRef(false);
  // Pointer-out dismissal applies to previews the pointer opened, not ones the viewer
  // asked for: having clicked, moving the mouse should not take it away again.
  const openedByClick = useRef(false);

  const clearOpenTimer = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = 0;
    }
  };

  const open = useCallback((viaClick = false) => {
    openedAt.current = Date.now();
    isPointerOnDialog.current = false;
    openedByClick.current = viaClick;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    clearOpenTimer();
    dismissedAt.current = Date.now();
    setIsOpen(false);
  }, []);

  useEffect(() => {
    // Scrolling a tile under a stationary cursor makes the browser dispatch mousemove with
    // the SAME client coordinates, so "a mousemove happened" is not evidence that the
    // viewer moved anything. Only a changed position counts.
    const noteMove = (event) => {
      if (event.clientX === pointerPos.current.x && event.clientY === pointerPos.current.y) {
        return;
      }
      pointerPos.current = { x: event.clientX, y: event.clientY };
      lastPointerMoveAt.current = Date.now();
      hasMovedSinceEnter.current = true;
    };
    const noteScroll = () => {
      lastScrollAt.current = Date.now();
    };

    document.addEventListener('mousemove', noteMove, { passive: true });
    window.addEventListener('scroll', noteScroll, { passive: true });
    return () => {
      document.removeEventListener('mousemove', noteMove);
      window.removeEventListener('scroll', noteScroll);
      clearOpenTimer();
    };
  }, []);

  // Every test runs when the timer fires, never at enter time: the browser dispatches
  // mouseenter BEFORE the mousemove that caused it, so anything checked on enter reads a
  // stale value and blocks even a deliberate first hover.
  const startIntentTimer = () => {
    clearOpenTimer();
    openTimer.current = setTimeout(() => {
      openTimer.current = 0;
      // The pointer arrived here under its own power, rather than the page sliding the
      // tile beneath a cursor that never moved.
      if (!hasMovedSinceEnter.current) return;
      // The page has come to rest. Catches a trackpad scroll with a little cursor drift,
      // which passes the movement test on its own.
      if (Date.now() - lastScrollAt.current < SCROLL_QUIET_MS) return;
      // Closing removes the backdrop from under the cursor and the browser fires a fresh
      // mouseenter on the tile below; that synthetic event has no movement behind it.
      if (lastPointerMoveAt.current <= dismissedAt.current) return;
      open();
    }, HOVER_INTENT_MS);
  };

  const handleTriggerEnter = () => {
    if (!canHover || isOpen) return;
    // Movement has to happen AFTER arriving. In the accidental case the tile arrives under
    // the pointer and no mousemove follows, so this stays false and nothing opens.
    hasMovedSinceEnter.current = false;
    startIntentTimer();
  };

  // A scroll that parks a tile under the cursor fires mouseenter once and never again, so
  // without this the tile could not be opened afterwards without leaving and returning. A
  // deliberate move inside it is the intent signal in that case.
  const handleTriggerMove = () => {
    if (!canHover || isOpen || openTimer.current) return;
    startIntentTimer();
  };

  // Cancel a pending open if the pointer leaves before the intent delay elapses.
  const handleTriggerLeave = () => clearOpenTimer();

  // Dialog behaviour while open: focus the close button, trap Tab inside the
  // card, close on Escape, and hand focus back to the tile that opened it.
  useEffect(() => {
    if (!isOpen) return undefined;

    const triggerEl = triggerRef.current;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
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
      triggerEl?.focus();
    };
  }, [isOpen, close]);

  // Pointer-out dismissal. mousemove on the backdrop rather than mouseleave on
  // the card: at open time the pointer is already outside the card, so a
  // mouseleave would never fire and the preview could only be closed another way.
  const handleBackdropMove = () => {
    if (!canHover || isPointerOnDialog.current || openedByClick.current) return;
    if (Date.now() - openedAt.current > DISMISS_GRACE_MS) close();
  };

  // Read during render, not stored in state: `open()` sets it before `setIsOpen`, so by the
  // time this subtree renders it already describes the gesture that opened it, and a click
  // never has to wait out an entrance tuned for a hover.
  const enterSeconds = reduced
    ? REDUCED_SECONDS
    : openedByClick.current
      ? CLICK_OPEN_SECONDS
      : OPEN_SECONDS;

  const previewImage = (
    <img
      src={project.preview}
      alt={`Landing page of the ${project.name} website`}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      width="1200"
      height="675"
      className="h-full w-full object-cover object-top"
    />
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        aria-expanded={isOpen}
        aria-controls={dialogId}
        onClick={() => {
          clearOpenTimer();
          if (isOpen) close();
          else open(true);
        }}
        onMouseEnter={handleTriggerEnter}
        onMouseMove={handleTriggerMove}
        onMouseLeave={handleTriggerLeave}
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left',
          'transition-[transform,border-color,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
          'hover:-translate-y-1 hover:border-aurora-teal/40',
          isOpen && 'opacity-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-teal focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
          className
        )}
        data-testid="expandable-project-card"
      >
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 z-10 h-px bg-line transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:bg-aurora-teal"
        />

        {/* Browser chrome, so the screenshot reads as a website rather than a photo. */}
        <span
          aria-hidden="true"
          className="flex h-[34px] shrink-0 items-center gap-3 border-b border-line px-4"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-text-dim/30" />
            <span className="h-2 w-2 rounded-full bg-text-dim/30" />
            <span className="h-2 w-2 rounded-full bg-text-dim/30" />
          </span>
          <span className="font-mono text-[11px] text-text-dim">{project.domain}</span>
        </span>

        {/* The screenshots are all 1200x675, so a 16:9 box shows every one of them whole:
            no crop, and every tile in the grid is exactly the same shape. */}
        <span className="block aspect-[16/9] overflow-hidden">{previewImage}</span>

        {/* Deliberately quiet, and deliberately below the image. The screenshot is what
            the visitor is here to look at; this is the caption on it. */}
        <span className="flex flex-1 items-baseline justify-between gap-4 px-5 py-4">
          <span className="font-display text-lg font-bold tracking-tight text-text">
            {project.name}
          </span>
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-text-dim">
            {project.sector}
          </span>
        </span>
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <React.Fragment key="preview">
                <motion.div
                  className="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm"
                  onClick={close}
                  onMouseMove={handleBackdropMove}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: enterSeconds, ease: EASE_EXPENSIVE },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: reduced ? REDUCED_SECONDS : CLOSE_SECONDS, ease: EASE_EXPENSIVE },
                  }}
                  aria-hidden="true"
                />

                <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                  <motion.div
                    ref={dialogRef}
                    id={dialogId}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={headingId}
                    onMouseEnter={() => {
                      isPointerOnDialog.current = true;
                    }}
                    onMouseLeave={() => {
                      isPointerOnDialog.current = false;
                      if (openedByClick.current) return;
                      if (canHover && Date.now() - openedAt.current > DISMISS_GRACE_MS) close();
                    }}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        duration: enterSeconds,
                        ease: EASE_EXPENSIVE,
                      },
                    }}
                    exit={{
                      opacity: 0,
                      y: reduced ? 0 : 12,
                      scale: reduced ? 1 : 0.98,
                      transition: {
                        duration: reduced ? REDUCED_SECONDS : CLOSE_SECONDS,
                        ease: EASE_EXPENSIVE,
                      },
                    }}
                    className="pointer-events-auto flex max-h-[90vh] w-[min(94vw,72rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_40px_100px_-25px_rgba(0,0,0,0.8)]"
                  >
                    <div className="flex h-[34px] shrink-0 items-center gap-3 border-b border-line px-4">
                      <span aria-hidden="true" className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-text-dim/30" />
                        <span className="h-2 w-2 rounded-full bg-text-dim/30" />
                        <span className="h-2 w-2 rounded-full bg-text-dim/30" />
                      </span>
                      <span className="font-mono text-[11px] text-text-dim">{project.domain}</span>

                      <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={close}
                        aria-label={`Close the ${project.name} preview`}
                        className="ml-auto -mr-2 grid h-11 w-11 place-items-center rounded-full text-text-dim transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-white/[0.06] hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-teal focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Side by side once there is room. Stacked, a 16:9 screenshot at this
                        width eats the viewport and pushes the description below the fold,
                        so the preview needed scrolling to read. Two columns fit both.
                        The media column keeps its 16:9 ratio at every width -- letting it
                        stretch to the dialog's height cropped the screenshot, which is the
                        one thing this preview exists to show. */}
                    <div className="min-h-0 flex-1 overflow-y-auto lg:flex lg:items-stretch lg:overflow-visible">
                      <div className="aspect-[16/9] w-full shrink-0 self-start overflow-hidden border-b border-line lg:w-[62%] lg:border-b-0 lg:border-r">
                        {previewImage}
                      </div>

                      <div className="flex flex-col justify-center p-7 sm:p-8">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-dim">
                          {project.sector}
                        </p>
                        <h3
                          id={headingId}
                          className="mt-3 font-display text-2xl font-bold tracking-tight text-text sm:text-3xl"
                        >
                          {project.name}
                        </h3>
                        <p className="mt-4 text-[15px] leading-relaxed text-text-dim">
                          {project.summary}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </React.Fragment>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
