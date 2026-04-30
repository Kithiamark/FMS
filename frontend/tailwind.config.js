/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'forest-green': '#1a3a1f',
        'green-mid': '#2e6b39',
        'green-light': '#4caf50',
        'amber-accent': '#e8a020',
        'cream-bg': '#f5f0e8',
        'risk-high': '#dc2626', // Red
        'risk-medium': '#d97706', // Amber
        'risk-low': '#16a34a', // Green
        
        // Vet Theme
        'vet-navy': '#0f2744',
        'vet-navy-light': '#1e3a5f',
        'vet-teal': '#0d9488',
        'vet-teal-dark': '#0f766e',

        // Admin Theme (Dark Mode)
        'admin-dark': '#09090b',
        'admin-card': '#111113',
        'admin-accent': '#2563eb', // Electric Blue
        'admin-text-main': '#e4e4e7',
        'admin-text-muted': '#a1a1aa',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'], // Added for logs
      }
    },
  },
  plugins: [],
}
