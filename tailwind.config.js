/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#0063eb',
          600: '#0056d6',
          700: '#14007a',
        },
        gray: {
          50: '#f8f9fa',
          100: '#e6e6e6',
          200: '#e0e4e9',
          800: '#232a31',
        },
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545',
      },
      animation: {
        'pulse': 'pulse 1.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
