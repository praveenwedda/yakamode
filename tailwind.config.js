/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // All theme colours reference the CSS custom properties defined in
      // src/index.css so the entire palette can be retuned in one place.
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        'surface-2': 'var(--bg-surface-2)',
        border: 'var(--border)',
        brand: {
          DEFAULT: 'var(--brand-purple)',
          light: 'var(--brand-purple-l)',
          dark: 'var(--brand-purple-d)',
        },
        'accent-white': 'var(--accent-white)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        numeric: ['"Rajdhani"', 'sans-serif'],
        body: ['"Outfit"', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px var(--purple-glow)',
        'glow-lg': '0 0 60px var(--purple-glow)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
    },
  },
  plugins: [],
};
