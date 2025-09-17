/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  safelist: [
    // Regional color classes for dynamic usage
    'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'hover:bg-blue-700', 'text-blue-600', 'text-blue-800',
    'bg-green-500', 'bg-green-600', 'bg-green-700', 'hover:bg-green-700', 'text-green-600', 'text-green-800',
    'bg-indigo-500', 'bg-indigo-600', 'bg-indigo-700', 'hover:bg-indigo-700', 'text-indigo-600', 'text-indigo-800',
    'bg-red-500', 'bg-red-600', 'bg-red-700', 'hover:bg-red-700', 'text-red-600', 'text-red-800',
    'bg-blue-100', 'bg-green-100', 'bg-indigo-100', 'bg-red-100',
    'focus:ring-blue-500', 'focus:ring-green-500', 'focus:ring-indigo-500', 'focus:ring-red-500',
    'focus:border-blue-500', 'focus:border-green-500', 'focus:border-indigo-500', 'focus:border-red-500',
    'ring-blue-500', 'ring-green-500', 'ring-indigo-500', 'ring-red-500'
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}