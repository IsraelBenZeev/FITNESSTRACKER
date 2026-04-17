# FitnessTracker — Claude Brief

## Stack
- **Vite + React 19 + TypeScript** (strict mode)
- **Tailwind CSS v3.4.1+** — utility classes + custom tokens (**חובה** — כל סטיילינג דרך Tailwind בלבד, ללא inline styles או CSS modules)
- **Supabase** — `@supabase/supabase-js`, anon key, no auth
- **Recharts** — bar/line charts with dark theme
- **lucide-react** — SVG icons (no emojis in UI)
- **Deploy:** `vercel deploy` from project root

## Supabase
- URL: `https://hzkbcguhupmdyfyzasex.supabase.co`
- Client: `src/lib/supabase.ts`
- RLS: anon can read + write both tables

### Tables
```sql
nutrition_log: id, date, time, meal_name, food_items,
               calories, protein_g, carbs_g, fat_g, notes, created_at

body_stats:    id, date, weight_kg, waist_cm, notes, created_at
```

## Constants (`src/lib/constants.ts`)
```ts
GOAL_CALORIES = 1900
GOAL_PROTEIN  = 119   // grams/day
START_WEIGHT  = 70    // kg
START_WAIST   = 88    // cm
```

## Design Tokens (Tailwind)
הצבעים מוגדרים ב-`tailwind.config.js` תחת `theme.extend.colors` ומשמשים ישירות כ-Tailwind classes:

```
bg-bg        → #0a0a0a   (background)
bg-surface   → #111111
bg-surface2  → #1a1a1a
border-col   → #222222   (border-[border-col] / border-border-col)
lime         → #D7FF00   ← accent ראשי: text-lime, bg-lime, border-lime
bg-lime-dim  → rgba(215,255,0,0.12)
text-muted   → #666666
bg-danger / text-danger → #ff4757

font-display: "Barlow Condensed"  → class: font-display
font-body:    "Rubik"             → class: font-body (ברירת מחדל)
```

### כללי סטיילינג
- **כל** סטיילינג — Tailwind utility classes בלבד
- **אסור** `style={{}}` inline, CSS modules, או קבצי `.css` חדשים
- כרטיסים: `border-t-2 border-lime`
- hover כרטיסים: `hover:border-lime transition-colors duration-200`
- אנימציית מעבר עמוד: class `page-enter` (מוגדר ב-`index.css`)

## Folder Structure
```
src/
  features/
    today/       TodayPage, MealCard, useToday
    history/     HistoryPage, useHistory
    body/        BodyPage, useBodyStats
  shared/
    components/  Header, TabBar, StatCard, ProgressBar, Card
    icons/       MealIcon (lucide-react mapped by meal_name)
  types/
    nutrition.ts  NutritionLog, DayTotals
    body.ts       BodyStat
    common.ts     Tab
  lib/
    supabase.ts
    constants.ts
  App.tsx
  main.tsx
  index.css
```

## UI / RTL
- `<html lang="he" dir="rtl">` — Hebrew RTL throughout
- All UI text in Hebrew
- Mobile-first (375px+), fixed bottom TabBar, sticky Header with blur
- No emojis — use `MealIcon` (lucide-react) for meal type icons
- Tab icons: `Zap` (היום), `BarChart2` (היסטוריה), `Activity` (גוף)

## שפת תקשורת
- **תמיד השב בעברית** — כל הסברים, הערות ותשובות יהיו בעברית בלבד
- שמות משתנים, פונקציות וקבצים — **באנגלית בלבד** (כמקובל בקוד)
- שמור על סגנון **מקצועי, תמציתי וברור** — ללא מילים מיותרות
- הסברי קוד יינתנו בעברית עם דגש על הגיון ועקרונות, לא על תרגום מילולי
