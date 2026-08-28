import React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../../lib/utils';

// react-day-picker v9 ships an opinionated stylesheet at the
// `react-day-picker/style.css` specifier -- verified it resolves (the
// package's `exports` map points it at `src/style.css`, which exists in
// node_modules) before deciding not to use it. It isn't imported here
// because every structural element the library renders (root, months,
// month, nav, caption, the day grid down to each day button) gets an
// explicit `classNames` override below, so the calendar never depends on
// the library's own CSS or its `--rdp-*` custom properties -- there would
// be nothing left for the stylesheet to usefully contribute, only
// `blue`-accent defaults to override.
const NAV_BUTTON =
  'inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover disabled:pointer-events-none disabled:opacity-30';

// h-11/w-11 is exactly the 44px minimum touch target -- do not shrink this
// for a denser-looking grid.
const DAY_BUTTON = cn(
  'relative z-10 mx-auto flex h-11 w-11 min-w-[44px] min-h-[44px] items-center justify-center rounded-full',
  'text-sm font-medium text-foreground transition-colors duration-200',
  'hover:bg-white/[0.06]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover',
  'disabled:pointer-events-none disabled:opacity-40 disabled:hover:bg-transparent',
  // These react to `data-selected`/`data-outside` set by react-day-picker on
  // the parent <td> (see the `day` classNames key below, which opts that
  // <td> into the `day` named group) -- the library only ever applies a
  // static className to the button itself, not per-modifier classes.
  'group-data-[selected=true]/day:bg-aurora-teal group-data-[selected=true]/day:text-ink group-data-[selected=true]/day:font-semibold group-data-[selected=true]/day:hover:bg-aurora-teal/90',
  'group-data-[outside=true]/day:text-muted-foreground/40'
);

// Today needs a marker that survives without color: a small dot under the
// date rather than a color swap. Color alone fails a colorblind visitor,
// and it disappears entirely once the same day is also selected (selection
// already owns the fill color) -- the dot stays visible in both states by
// switching to an ink-colored dot when selected.
function CalendarDayButton({ className, day, modifiers, children, ...props }) {
  const ref = React.useRef(null);

  // Mirrors react-day-picker's own default DayButton: the day with
  // `modifiers.focused` is the library's current roving-tabindex target, so
  // moving real DOM focus there on every render is what makes arrow-key
  // navigation actually move focus instead of just changing state.
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button ref={ref} className={cn(DAY_BUTTON, className)} {...props}>
      <span>{children}</span>
      {modifiers.today && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full',
            modifiers.selected ? 'bg-ink' : 'bg-aurora-cyan'
          )}
        />
      )}
    </button>
  );
}

/**
 * Dark-palette wrapper over react-day-picker v9's `DayPicker`, styled to
 * match the project's popover surface. Defaults to single-date selection;
 * pass `disabled={{ before: someDate }}` etc. to restrict which dates can
 * be picked -- this component does not hardcode any date restriction
 * itself so it stays reusable for future non-"future date only" cases.
 */
export function Calendar({ className, classNames, components, ...props }) {
  return (
    <DayPicker
      mode="single"
      showOutsideDays
      className={cn('p-3', className)}
      classNames={{
        months: 'relative flex flex-col gap-4 sm:flex-row',
        month: 'flex w-full flex-col gap-3',
        nav: 'absolute inset-x-0 top-0 z-20 flex w-full items-center justify-between',
        button_previous: cn(NAV_BUTTON, 'absolute left-1'),
        button_next: cn(NAV_BUTTON, 'absolute right-1'),
        month_caption: 'flex h-9 items-center justify-center px-10',
        caption_label: 'text-sm font-semibold text-foreground',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'w-11 shrink-0 pb-2 text-center text-[0.72rem] font-medium uppercase tracking-wide text-muted-foreground',
        weeks: 'flex flex-col gap-1',
        week: 'flex w-full gap-1',
        day: 'group/day relative h-11 w-11 shrink-0 p-0 text-center align-middle',
        chevron: 'h-4 w-4 fill-muted-foreground',
        ...classNames,
      }}
      components={{ DayButton: CalendarDayButton, ...components }}
      {...props}
    />
  );
}
