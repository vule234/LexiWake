/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3525cd',
        background: '#f8f9fa',
        surface: '#ffffff',
        error: '#ef4444',
        success: '#22c55e',
      },
    },
  },
  plugins: [],
}
