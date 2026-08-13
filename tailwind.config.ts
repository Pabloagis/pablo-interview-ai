import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-doto)', '"Space Mono"', 'monospace'],
        sans: ['var(--font-space-grotesk)', '"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', '"JetBrains Mono"', '"SF Mono"', 'monospace'],
      },
      colors: {
        primary: '#3B82F6',
        'nd-black':          'var(--black)',
        'nd-surface':        'var(--surface)',
        'nd-surface-raised': 'var(--surface-raised)',
        'nd-border':         'var(--border)',
        'nd-border-visible': 'var(--border-visible)',
        'nd-text-disabled':  'var(--text-disabled)',
        'nd-text-secondary': 'var(--text-secondary)',
        'nd-text-primary':   'var(--text-primary)',
        'nd-text-display':   'var(--text-display)',
        'nd-accent':         'var(--accent)',
        'nd-accent-subtle':  'var(--accent-subtle)',
        'nd-success':        'var(--success)',
        'nd-warning':        'var(--warning)',
        'nd-interactive':    'var(--interactive)',
      },
    },
  },
  plugins: [],
};

export default config;
