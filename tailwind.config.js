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
            start: '#1e3a5f',
            mid: '#6b2d7b',
            end: '#c41e7f',
          },
        },
        // Semantic colors
        primary: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#1e3a5f',
          600: '#1a3354',
          700: '#152a45',
          800: '#102236',
          900: '#0a1628',
        },
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#c41e7f',
          600: '#9c1866',
          700: '#7c134f',
          800: '#5c0f3a',
          900: '#3c0a26',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'sceneside-gradient': 'linear-gradient(135deg, #1e3a5f 0%, #6b2d7b 50%, #c41e7f 100%)',
        'sceneside-gradient-reverse': 'linear-gradient(135deg, #c41e7f 0%, #6b2d7b 50%, #1e3a5f 100%)',
      },
    },
  },
  plugins: [],
}
