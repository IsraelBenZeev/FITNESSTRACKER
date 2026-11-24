import plugin from 'tailwindcss/plugin.js'

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
        // Data series: macros (≥4.5:1 on surface) — protein blue and carbs orange, like the BodyBuddy app
        'macro-protein': '#60A5FA',
        'macro-carbs': '#FB923C',
        'macro-fat': '#E0B354',
        // ── BodyBuddy app palette (workouts screens are ported 1:1 from the app and use its tokens) ──
        lime: {
          50: 'rgb(247, 255, 224)', 100: 'rgb(238, 255, 184)', 200: 'rgb(228, 255, 140)',
          300: 'rgb(213, 255, 95)', 400: 'rgb(180, 230, 60)', 500: 'rgb(150, 200, 40)',
          600: 'rgb(120, 170, 30)', 700: 'rgb(90, 130, 20)', 800: 'rgb(60, 90, 15)',
          900: 'rgb(40, 60, 10)', 1000: 'rgb(20, 30, 5)',
        },
        zinc: {
          200: '#e2e7ee', 300: '#c8d0db', 400: '#a3aebd', 500: '#7f8c9e', 600: '#4a566a',
          700: '#3a4557', 800: '#2c3545', 900: '#252d3a', 950: '#1a2030',
        },
        background: {
          50: '#f4f4f5', 100: '#e4e4e7', 200: '#d4d4d8', 300: '#a1a1aa', 400: '#71717a',
          500: '#52525b', 600: '#3f3f46', 700: '#323c4d', 800: '#2c3545', 850: '#232b39',
          900: '#252d3a', 950: '#222a37', 1000: '#1f2634', 1100: '#1c2332', 1200: '#1a2030',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        body: ['"Rubik"', 'sans-serif'],
      },
      // BodyBuddy logo intro (~0.55s): hexagon spins in 0–0.45s, H pops at 0.15s, "Body" / "Buddy" slide in from both sides at 0.25s
      keyframes: {
        'bb-hex-in': { from: { opacity: '0', transform: 'scale(0.6) rotate(-30deg)' }, to: { opacity: '1', transform: 'scale(1) rotate(0deg)' } },
        'bb-pop': { from: { opacity: '0', transform: 'scale(0.3)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'bb-slide-l': { from: { opacity: '0', transform: 'translateX(-60px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'bb-slide-r': { from: { opacity: '0', transform: 'translateX(60px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'bb-fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        // Workout screens (ported from the app's reanimated animations)
        'bb-spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        'bb-nudge': { '0%, 100%': { transform: 'translateX(0)' }, '50%': { transform: 'translateX(-6px)' } },
        'bb-shimmer': { '0%, 100%': { opacity: '0.55' }, '50%': { opacity: '1' } },
        'bb-burst': { '0%': { opacity: '0.7', transform: 'scale(1)' }, '100%': { opacity: '0', transform: 'scale(2.4)' } },
        'bb-zoom': { from: { transform: 'scale(0)' }, to: { transform: 'scale(1)' } },
        'bb-tick': { from: { opacity: '0.2', transform: 'translateY(-40%)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'bb-blink': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.15' } },
        'bb-drop': { from: { opacity: '0', transform: 'translateY(-80px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'bb-countdown': { from: { strokeDashoffset: '0' }, to: { strokeDashoffset: 'var(--bb-circ)' } },
        'bb-rise-in': { from: { opacity: '0', transform: 'translateY(-16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'bb-land': { from: { opacity: '0', transform: 'scale(0.9)' }, to: { opacity: '1', transform: 'scale(1)' } },
        // reanimated FadeInDown (floating selection bar on the avatar screen)
        'bb-fade-in-down': { from: { opacity: '0', transform: 'translateY(-25px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'bb-hex-in': 'bb-hex-in 450ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'bb-pop': 'bb-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 150ms both',
        'bb-slide-l': 'bb-slide-l 300ms cubic-bezier(0.2, 0.9, 0.3, 1) 250ms both',
        'bb-slide-r': 'bb-slide-r 300ms cubic-bezier(0.2, 0.9, 0.3, 1) 250ms both',
        'bb-fade-out': 'bb-fade-out 250ms ease-in both',
        'bb-spin': 'bb-spin 1.3s cubic-bezier(0.34, 1.56, 0.64, 1) infinite',
        'bb-nudge': 'bb-nudge 2.2s ease-in-out infinite',
        'bb-shimmer': 'bb-shimmer 2.2s ease-in-out infinite',
        'bb-burst': 'bb-burst 520ms ease-out both',
        'bb-zoom': 'bb-zoom 200ms ease-out both',
        'bb-tick': 'bb-tick 300ms ease-out both',
        'bb-blink': 'bb-blink 1.4s ease-in-out infinite',
        'bb-drop': 'bb-drop 360ms cubic-bezier(0.33, 1, 0.68, 1) both',
        'bb-countdown': 'bb-countdown linear both',
        'bb-rise-in': 'bb-rise-in 400ms ease-out both',
        'bb-land': 'bb-land 200ms ease-out both',
        'bb-fade-in-down': 'bb-fade-in-down 220ms ease-out both',
      },
    },
  },
  plugins: [
    // The app's typography scale (BodyBuddy-Client tailwind.config.js), so ported screens keep their classes
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.typo-h1': { fontSize: '30px', fontWeight: '900', lineHeight: '36px', letterSpacing: '-0.3px' },
        '.typo-h2': { fontSize: '24px', fontWeight: '900', lineHeight: '30px', letterSpacing: '-0.2px' },
        '.typo-h3': { fontSize: '20px', fontWeight: '700', lineHeight: '26px' },
        '.typo-h4': { fontSize: '18px', fontWeight: '700', lineHeight: '24px' },
        '.typo-body': { fontSize: '16px', fontWeight: '400', lineHeight: '22px' },
        '.typo-body-primary': { fontSize: '16px', fontWeight: '600', lineHeight: '22px' },
        '.typo-btn-cta': { fontSize: '16px', fontWeight: '800', lineHeight: '20px', letterSpacing: '0.2px' },
        '.typo-btn-secondary': { fontSize: '16px', fontWeight: '600', lineHeight: '20px' },
        '.typo-label': { fontSize: '14px', fontWeight: '500', lineHeight: '18px', letterSpacing: '0.1px' },
        '.typo-input': { fontSize: '16px', fontWeight: '400', lineHeight: '20px' },
        '.typo-caption': { fontSize: '12px', fontWeight: '400', lineHeight: '16px' },
        '.typo-caption-bold': { fontSize: '12px', fontWeight: '700', lineHeight: '16px', letterSpacing: '0.4px' },
      })
    }),
  ],
}
