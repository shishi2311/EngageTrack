/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          hover: 'var(--bg-hover)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          default: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          inverse: 'var(--text-inverse)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          'primary-hover': 'var(--accent-primary-hover)',
          'primary-subtle': 'var(--accent-primary-subtle)',
        },
        health: {
          healthy: 'var(--health-healthy)',
          'healthy-bg': 'var(--health-healthy-bg)',
          'at-risk': 'var(--health-at-risk)',
          'at-risk-bg': 'var(--health-at-risk-bg)',
          critical: 'var(--health-critical)',
          'critical-bg': 'var(--health-critical-bg)',
          failing: 'var(--health-failing)',
          'failing-bg': 'var(--health-failing-bg)',
        },
        status: {
          progress: 'var(--status-progress)',
          blocker: 'var(--status-blocker)',
          risk: 'var(--status-risk)',
          general: 'var(--status-general)',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '350ms',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease forwards',
        shimmer: 'shimmer 1.5s infinite',
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
