/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-primary': '#2563eb',
        'game-secondary': '#4f46e5',
        'game-accent': '#10b981',
      }
    },
  },
  plugins: [],
} 