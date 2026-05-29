import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Warmer, more muted forest-sage. Primary action colour is sage-600
        // — calmer than the prior #3c6434 so the UI reads contemplative.
        sage: {
          50:  '#f4f6f1',
          100: '#e6ebe0',
          200: '#cdd6c4',
          300: '#a8b89c',
          400: '#80967a',
          500: '#5f7758',
          600: '#4a6242',  // primary
          700: '#3c5036',
          800: '#2f3f2b',
          900: '#253220',
          950: '#131c0f',
        },
        // Paper / cream surface tokens — the warm body background and card tints
        paper: {
          50:  '#fbf9f3',
          100: '#f5f1e8',  // page background
          200: '#ece4d4',
        },
        sand: '#dccfb8',
        mist: '#a7b79e',
        gold: {
          50:  '#fbf6ea',
          100: '#f3e9c8',
          200: '#e6d391',
          400: '#c9a96b',
          500: '#b59a5b',  // accent / focus
          600: '#9c8347',
          700: '#7c6939',
        },
        ink: '#2f332f',
      },
      fontFamily: {
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:  ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
