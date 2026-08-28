/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        aurora: {
          teal: '#2DD4C4',
          cyan: '#06B6D4',
          indigo: '#6366F1',
        },
        ink: '#05070A',
        surface: '#0B0F14',
        line: 'rgba(255,255,255,0.08)',
        text: '#E8EDF2',
        'text-dim': '#8A97A6',

        // Semantic tokens (shadcn-compatible) mapped onto the palette above.
        // Values reference CSS vars in src/index.css storing bare "R G B"
        // triplets, so rgb(var(--x) / <alpha-value>) lets Tailwind opacity
        // modifiers (bg-primary/20, border-border/80, ...) work correctly —
        // a var holding a hex string would silently break those.
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
      },
      fontFamily: {
        display: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: {
        content: '72rem',
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      spacing: {
        section: '8rem',
        'section-lg': '10rem',
      },
      transitionTimingFunction: {
        expensive: 'cubic-bezier(0.16, 1, 0.3, 1)',
        smooth: 'cubic-bezier(0.65, 0.05, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // Radix Accordion reports its measured height via this custom
        // property; animating to/from it (not to a fixed px value) is what
        // makes the collapse work for content of any length.
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        // Combined opacity+scale in one keyframe (rather than two separate
        // animate-* utilities) because Tailwind's `animation` property can
        // only hold one value at a time — stacking two utility classes would
        // just have the later one win, not compose.
        'zoom-fade-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'zoom-fade-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.96)' },
        },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-out-right': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(100%)' } },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        'slide-out-left': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-100%)' } },
        'slide-in-top': { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(0)' } },
        'slide-out-top': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-100%)' } },
        'slide-in-bottom': { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        'slide-out-bottom': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(100%)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.9s cubic-bezier(0.16,1,0.3,1) forwards',
        marquee: 'marquee 40s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.15s ease-out',
        'fade-out': 'fade-out 0.15s ease-in',
        'zoom-fade-in': 'zoom-fade-in 0.15s cubic-bezier(0.16,1,0.3,1)',
        'zoom-fade-out': 'zoom-fade-out 0.1s ease-in',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-out-right': 'slide-out-right 0.2s ease-in',
        'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-out-left': 'slide-out-left 0.2s ease-in',
        'slide-in-top': 'slide-in-top 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-out-top': 'slide-out-top 0.2s ease-in',
        'slide-in-bottom': 'slide-in-bottom 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-out-bottom': 'slide-out-bottom 0.2s ease-in',
      },
    },
  },
  plugins: [],
};
