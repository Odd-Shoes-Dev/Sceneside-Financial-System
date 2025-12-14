/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sceneside brand colors derived from logo
        sceneside: {
          green: '#52b53b',
          'green-light': '#6bc956',
          'green-dark': '#449932',
          'green-darker': '#367a28',
          navy: '#1e3a5f',
          'navy-light': '#2a4a73',
          'navy-dark': '#152a45',
          magenta: '#c41e7f',
          'magenta-light': '#d94a9a',
          'magenta-dark': '#9c1866',
          purple: '#6b2d7b',
          'purple-light': '#8a4a9a',
          'purple-dark': '#4a1f55',
          gradient: {
            start: '#52b53b',
            mid: '#449932',
            end: '#367a28',
          },
        },
        // Semantic colors
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#52b53b',
          600: '#449932',
          700: '#367a28',
          800: '#2d6622',
          900: '#1f4c18',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#6bc956',
          500: '#52b53b',
          600: '#449932',
          700: '#367a28',
          800: '#2d6622',
          900: '#1f4c18',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'sceneside-gradient': 'linear-gradient(135deg, #52b53b 0%, #449932 50%, #367a28 100%)',
        'sceneside-gradient-reverse': 'linear-gradient(135deg, #367a28 0%, #449932 50%, #52b53b 100%)',
      },
    },
  },
  plugins: [],
}
