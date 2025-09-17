/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'teal': {
          50: '#f0fdfd',
          100: '#ccfbfb',
          200: '#99f6f6',
          300: '#5eeded',
          400: '#2dd4d4',
          500: '#009999', // Our primary teal
          600: '#0d8a8a',
          700: '#166f6f',
          800: '#185959',
          900: '#194a4a',
          950: '#082f2f',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}