/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Universal Neutral Base (Slate)
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
          subtle: '#f1f5f9',
          border: '#e2e8f0',
          'border-strong': '#cbd5e1',
        },
        // Role Dynamic Accent (Driven by CSS variables per role)
        role: {
          accent: 'var(--role-accent, #1a3a1f)',
          'accent-hover': 'var(--role-accent-hover, #2e6b39)',
          'accent-subtle': 'var(--role-accent-subtle, #ecfdf5)',
          'accent-text': 'var(--role-accent-text, #065f46)',
          'accent-border': 'var(--role-accent-border, #a7f3d0)',
        },
        // Role Accents (Explicit tokens)
        // 1. Farmer / Farm Worker
        'forest-green': '#1a3a1f',
        'green-mid': '#2e6b39',
        'green-light': '#4caf50',
        'cream-bg': '#f8fafc',

        // 2. Vet (Teal & Navy)
        'vet-navy': '#0f2744',
        'vet-navy-light': '#1e3a5f',
        'vet-teal': '#0d9488',
        'vet-teal-dark': '#0f766e',
        'vet-teal-subtle': '#f0fdfa',

        // 3. Aggregator (Consistent Logistics Blue)
        'aggregator-blue': '#2563eb',
        'aggregator-dark': '#1d4ed8',
        'aggregator-subtle': '#eff6ff',
        'aggregator-border': '#bfdbfe',

        // 4. Admin (Admin Accent & System Slate)
        'admin-accent': '#2563eb',
        'admin-accent-dark': '#1d4ed8',
        'admin-dark': '#0f172a',
        'admin-card': '#1e293b',
        'admin-text-main': '#0f172a',
        'admin-text-muted': '#64748b',

        // Universal Risk / Alert Tokens
        'amber-accent': '#e8a020',
        'risk-high': '#dc2626',
        'risk-medium': '#d97706',
        'risk-low': '#16a34a',
      },
      borderRadius: {
        'card': 'var(--radius-card, 1rem)',
        'btn': 'var(--radius-btn, 0.75rem)',
        'input': 'var(--radius-input, 0.75rem)',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
