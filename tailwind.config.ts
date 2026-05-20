import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#f2f5f0',
          100: '#e4ebe0',
          200: '#c7d6c1',
          300: '#9cbb93',
          400: '#6d9b62',
          500: '#4d7d43',
          600: '#3c6434',  // primary action colour
          700: '#305129',
          800: '#27421f',
          900: '#1c3116',
          950: '#0e1c0b',
        },
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
