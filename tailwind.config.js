/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#111111',
        surface2: '#1a1a1a',
        'border-col': '#222222',
        lime: '#D7FF00',
        'lime-dim': 'rgba(215,255,0,0.12)',
        'text-col': '#f0f0f0',
        muted: '#666666',
        danger: '#ff4757',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'cursive'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
