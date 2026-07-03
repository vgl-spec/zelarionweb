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
      },
      animation: {
        'fade-up': 'fade-up 0.9s cubic-bezier(0.16,1,0.3,1) forwards',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [],
};
