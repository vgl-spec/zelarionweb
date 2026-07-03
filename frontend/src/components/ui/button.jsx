import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,background-color,border-color,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        solid:
          'text-ink font-semibold bg-[linear-gradient(100deg,#2DD4C4,#06B6D4_48%,#6366F1)] shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_8px_30px_-8px_rgba(6,182,212,0.55)] hover:shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_12px_40px_-6px_rgba(6,182,212,0.7)] hover:-translate-y-[1px]',
        outline:
          'text-text border border-line bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 backdrop-blur-sm',
        ghost: 'text-text-dim hover:text-text hover:bg-white/[0.04]',
        link: 'text-text-dim hover:text-text underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-[13px] rounded-full',
        md: 'h-11 px-6 text-sm rounded-full',
        lg: 'h-[52px] px-8 text-[15px] rounded-full',
      },
    },
    defaultVariants: { variant: 'solid', size: 'md' },
  }
);

export const Button = React.forwardRef(
  ({ className, variant, size, asChild, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
