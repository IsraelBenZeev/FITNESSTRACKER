/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        bg: '#1A2030',
        surface: '#252D3A',
        surface2: '#2C3545',       // "inner"
        'border-col': 'rgba(255,255,255,0.08)', // "line"
        accent: '#96C828',         // "green"
        'accent-soft': 'rgba(150,200,40,0.14)',
        'accent-line': 'rgba(150,200,40,0.40)',
        'text-col': '#C8D0DB',     // body text
        heading: '#FFFFFF',
        muted: '#8C9AAB',          // "text-2": secondary text, 5.5:1 on bg
        subtle: '#516070',         // "muted": decorative / disabled only (fails 4.5:1 for text)
        danger: '#F87171',         // "warning"
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['"Rubik"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
