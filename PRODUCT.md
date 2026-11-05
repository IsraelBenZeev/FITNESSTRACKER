# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
One person: the owner, on their own phone (mobile web, 375px+). They open it right after eating to log a meal, and several times a day to check how much is left before the calorie and protein goals. They also open it at the gym to log workouts, and periodically to log weight and waist.

## Product Purpose
A personal nutrition, body, and workout log. Success means logging a meal in seconds, knowing at a glance how much is left of today's calorie and protein goals, keeping a consistent daily streak, and being able to look back over the day, the history, and body trends.

## Operating Context
- Used one-handed on a phone, often right after a meal, sometimes outdoors or in a gym.
- Hebrew, RTL throughout.
- Goals differ between training and rest days (`useGoals`: trainingDays, training/rest calories and protein).
- Streak = consecutive days with at least one nutrition entry (`useStreak`).

## Capabilities and Constraints
- Tabs: Today (meals and goals), History (calendar, day detail, export), Body (weight and waist stats and charts), Workout (plans, live session, history).
- Stack: Vite + React 19 + TypeScript strict, Tailwind only (no inline styles, no new CSS files), Supabase, Recharts, lucide-react icons (no emoji in UI).
- Meals have: meal_name (type), time, food_items (free text), calories, protein_g, carbs_g, fat_g.
- Deploys to Vercel from `main`.

## Brand Commitments
- Palette chosen by the owner (from another project of theirs): navy-slate dark ground #1A2030, surfaces #252D3A / #2C3545, green accent #96C828, text #C8D0DB / #8C9AAB, headings #FFFFFF, warning #F87171. Structure, type and components are open.

## Evidence on Hand
Real personal data in Supabase. No marketing assets, testimonials, or illustrations exist; none should be invented.

## Product Principles
1. Logging is the core loop. Adding a meal must take the fewest taps and never get buried.
2. One glance answers "how much is left today?" for calories and protein.
3. Consistency is the motivator: progress and streaks are surfaced, not hidden.
4. The day reads as a timeline: what was eaten, and when.
5. Built for a thumb on a phone first.

## Accessibility & Inclusion
Readable outdoors: text contrast ≥4.5:1 and touch targets ≥44px.
