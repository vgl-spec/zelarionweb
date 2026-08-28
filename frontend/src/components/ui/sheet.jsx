import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      data-slot="sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
        'data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
        className
      )}
      {...props}
    />
  );
});
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

// side -> [edge classes, enter animation, exit animation]. Kept as a plain
// map (not cva) because the animation choice depends on `side`, not just a
// class string swap — cva can't express "pick a different keyframe name".
const SIDE_CONFIG = {
  top: {
    edge: 'inset-x-0 top-0 border-b',
    enter: 'animate-slide-in-top',
    exit: 'animate-slide-out-top',
  },
  bottom: {
    edge: 'inset-x-0 bottom-0 border-t',
    enter: 'animate-slide-in-bottom',
    exit: 'animate-slide-out-bottom',
  },
  left: {
    edge: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
    enter: 'animate-slide-in-left',
    exit: 'animate-slide-out-left',
  },
  right: {
    edge: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
    enter: 'animate-slide-in-right',
    exit: 'animate-slide-out-right',
  },
};

// Radix throws an a11y warning if DialogContent doesn't have an accessible
// title in its tree. Consumers must render <SheetTitle> (visually hide it
// with sr-only if the design doesn't call for a visible one) — this
// component cannot supply a sane default title on their behalf.
export const SheetContent = React.forwardRef(({ side = 'right', className, children, ...props }, ref) => {
  const { edge, enter, exit } = SIDE_CONFIG[side];
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 flex flex-col gap-4 border-border bg-surface p-6 text-foreground shadow-[0_20px_60px_-12px_rgba(0,0,0,0.7)]',
          'data-[state=open]:' + enter,
          'data-[state=closed]:' + exit,
          edge,
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            'absolute right-4 top-4 rounded-sm text-muted-foreground transition-colors duration-300 hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:pointer-events-none'
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = DialogPrimitive.Content.displayName;

export const SheetHeader = ({ className, ...props }) => (
  <div data-slot="sheet-header" className={cn('flex flex-col gap-1.5 text-center sm:text-left', className)} {...props} />
);

export const SheetFooter = ({ className, ...props }) => (
  <div
    data-slot="sheet-footer"
    className={cn('mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
    {...props}
  />
);

export const SheetTitle = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Title
      ref={ref}
      data-slot="sheet-title"
      className={cn('font-display text-lg font-semibold text-foreground', className)}
      {...props}
    />
  );
});
SheetTitle.displayName = DialogPrimitive.Title.displayName;

// Optional, but export it alongside SheetTitle: Radix's a11y check is
// satisfied by the title alone, this just lets consumers add supporting
// copy without reaching for a raw <p>.
export const SheetDescription = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Description
      ref={ref}
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});
SheetDescription.displayName = DialogPrimitive.Description.displayName;
