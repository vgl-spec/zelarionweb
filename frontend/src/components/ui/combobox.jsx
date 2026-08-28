import React, { useEffect, useId, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from './popover';
import { cn } from '../../lib/utils';

function filterOptions(options, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return options;
  return options.filter((option) => option.toLowerCase().includes(needle));
}

/**
 * A text input with a filtered suggestion dropdown that still accepts free
 * text matching none of `options` -- built for fields where the option list
 * is a set of common answers, not an exhaustive enum ("a textbox also while
 * being dropdown so user can type there the product they want"). Implements
 * the WAI-ARIA 1.2 combobox pattern with "list" autocomplete: the input
 * owns real DOM focus at all times, and the active suggestion is tracked
 * virtually via `aria-activedescendant` rather than by moving focus into
 * the listbox -- so arrowing through suggestions never steals focus from
 * what the user is typing.
 *
 * Keyboard: ArrowDown/ArrowUp open the list (if closed) and move the active
 * suggestion; Enter commits the active suggestion, or the typed text as-is
 * if none is active; Escape closes the list without touching the typed
 * text; Tab closes the list and moves focus normally.
 */
export const Combobox = React.forwardRef(function Combobox(
  {
    value,
    onValueChange,
    options,
    placeholder,
    id,
    maxLength,
    className,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  forwardedRef
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const listboxId = `${inputId}-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const optionRefs = useRef([]);

  const text = value ?? '';
  const filtered = filterOptions(options, text);
  const showFreeTextHint = text.trim().length > 0 && filtered.length === 0;
  // A keystroke can shrink the filtered list out from under whatever index
  // the user had arrowed to -- clamp at render time instead of chasing it
  // with an effect, so there is never a frame where the two disagree.
  const clampedActiveIndex = activeIndex >= filtered.length ? -1 : activeIndex;
  const activeOptionId = clampedActiveIndex >= 0 ? `${inputId}-option-${clampedActiveIndex}` : undefined;

  useEffect(() => {
    if (clampedActiveIndex >= 0) {
      optionRefs.current[clampedActiveIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [clampedActiveIndex]);

  const commit = (nextValue) => {
    onValueChange(nextValue);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleChange = (e) => {
    const next = e.target.value;
    onValueChange(maxLength ? next.slice(0, maxLength) : next);
    setOpen(true);
    // Typing never auto-selects a suggestion -- Enter right after typing
    // commits what was typed, not whatever happens to filter to the top.
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(filtered.length > 0 ? 0 : -1);
          break;
        }
        setActiveIndex((current) => Math.min(current + 1, filtered.length - 1));
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(filtered.length > 0 ? 0 : -1);
          break;
        }
        setActiveIndex((current) => (current <= 0 ? -1 : current - 1));
        break;
      }
      case 'Enter': {
        if (!open) break; // let Enter behave like any other text field (form submit)
        e.preventDefault();
        if (clampedActiveIndex >= 0 && filtered[clampedActiveIndex]) {
          commit(filtered[clampedActiveIndex]);
        } else {
          setOpen(false);
        }
        break;
      }
      case 'Escape': {
        if (!open) break;
        e.stopPropagation();
        setOpen(false);
        setActiveIndex(-1);
        break;
      }
      case 'Tab': {
        setOpen(false);
        break;
      }
      default:
        break;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <input
          ref={(node) => {
            if (typeof forwardedRef === 'function') forwardedRef(node);
            else if (forwardedRef) forwardedRef.current = node;
          }}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          autoComplete="off"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            'flex h-11 w-full rounded-md border border-input bg-white/[0.02] px-4 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-ring',
            'aria-[invalid=true]:border-destructive',
            className
          )}
          {...props}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={6}
        // The input must never lose real focus to the popup -- this is a
        // virtual-focus (aria-activedescendant) combobox, not a menu.
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-[--radix-popover-trigger-width] max-h-64 overflow-y-auto p-1"
      >
        <ul id={listboxId} role="listbox" aria-label={placeholder || 'Suggestions'}>
          {filtered.map((option, index) => {
            const optionId = `${inputId}-option-${index}`;
            const isActive = index === clampedActiveIndex;
            return (
              <li
                key={option}
                id={optionId}
                role="option"
                aria-selected={isActive}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                // preventDefault on mousedown, not just handling onClick:
                // mousedown is what would otherwise blur the input and
                // close the popover before the click ever registers.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(option)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  'flex cursor-pointer select-none items-center justify-between rounded-sm px-3 py-2 text-sm text-foreground transition-colors duration-150',
                  isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'
                )}
              >
                {option}
                {isActive && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
              </li>
            );
          })}
          {showFreeTextHint && (
            <li role="presentation" className="select-none px-3 py-2 text-xs text-muted-foreground">
              Use "{text.trim()}"
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
});
