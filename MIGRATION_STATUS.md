# Migration Status: FitnessTracker → BodyBuddy

## פרויקטים
| | FitnessTracker (SOURCE) | BodyBuddy (TARGET) |
|---|---|---|
| Project ID | hzkbcguhupmdyfyzasex | arxscyvqikyjupszspym |
| URL | https://hzkbcguhupmdyfyzasex.supabase.co | https://arxscyvqikyjupszspym.supabase.co |
| Status | ACTIVE | ACTIVE |

## User ID Mapping
- FitnessTracker UIDs: `abed08d4-1cf1-492d-b22b-9be21e0a6bb6`, `9a24d9b0-097c-441d-afb4-58577346f02c`
- BodyBuddy UID: `f2290863-2572-4006-8fb7-4e15d612eb17` (email: i0548542122@gmail.com)
- **כל נתון שמיוגרט חייב להחליף user_id ל-BodyBuddy UID**
- לא הצלחנו לשנות את ה-UUID ב-auth.users כי Supabase חוסם גישה לטבלאות auth

## קבצים
- `migration/config.ts` — חיבור ל-2 הפרויקטים + מיפוי user_ids
- `migration/migrate-body-stats.ts` — סקריפט מיגרציה ל-body_stats
- `migration/migrate-nutrition-log.ts` — סקריפט מיגרציה ל-nutrition_log (מוכן, טרם הורץ)
- `migration/logs/` — תיקייה ללוגים של מיגרציות

---

## שלב 1: body_stats ✅ הושלם
- נוצרה טבלת `body_stats` ב-BodyBuddy (לא הייתה קיימת)
- סכמה: id (uuid PK), user_id (uuid FK → auth.users), date, weight_kg, waist_cm, notes, created_at
- 177 שורות הועברו בהצלחה
- user_id הוחלף ל-BodyBuddy UID
- FK ל-auth.users פעיל
- RLS פתוח (anon can read+write)

## שלב 2: nutrition_log → nutrition_entries ⏳ בתהליך
### מה סוכם:
- כל שורה מ-`nutrition_log` נכנסת כ-entry אחד ב-`nutrition_entries`
- מיפוי: food_items→food_name, meal_name→group_name, מאקרו מעוגל ל-int
- source = 'fitnesstracker' לסימון נתונים מיובאים
- group_id משותף לכל שילוב date+meal_name
- food_item_id = NULL (טקסט חופשי, לא מקושר למאכל)
- לוג JSON נשמר עם source_id ו-target_id לכל שורה

### מה נתקע:
- RLS חוסם את ה-INSERT מה-anon key (גם ב-source וגם ב-target)
- נוספו policies זמניים שצריך לטפל בהם:
  - `temp_migration_read` על `nutrition_log` ב-FitnessTracker — **להסיר כשמסיימים**
  - `temp_migration_insert` על `nutrition_entries` ב-BodyBuddy — **להסיר כשמסיימים**
- צריך גם להוסיף `temp_migration_select` על nutrition_entries ב-BodyBuddy (כי הסקריפט עושה .select('id') אחרי INSERT)

### rollback:
```sql
DELETE FROM public.nutrition_entries WHERE source = 'fitnesstracker';
```

## שלב 3: user_goals 📋 טרם התחיל
- טבלה קיימת ב-FitnessTracker עם יעדי קלוריות/חלבון (ימי אימון + מנוחה)
- צריך להחליט: לשלב עם profiles של BodyBuddy או ליצור טבלה נפרדת

## שלב 4: workout tables 📋 טרם התחיל
- FitnessTracker: workout_plans, workout_plan_exercises, workout_logs, workout_set_logs
- BodyBuddy: workouts_plans, sessions, exercise_logs
- צריך מיפוי בין הסכמות — הכי מורכב

## שלב 5: שינוי קוד FitnessTracker 📋 טרם התחיל
- להחליף Supabase URL/Key ל-BodyBuddy
- להתאים queries לסכמה החדשה
- לבדוק שהכל עובד

---

## הערות כלליות
- את BodyBuddy לא משנים (חוץ מהוספת טבלאות חדשות שלא קיימות)
- FitnessTracker צריך להתאים את עצמו לטבלאות הקיימות ב-BodyBuddy
- ב-nutrition_entries יש 3 סוגי entries קיימים: מ-food_items (עם food_item_id), מ-foods (בלי food_item_id), מ-AI (source='ai'). הנתונים המיוגרטים הם סוג רביעי (source='fitnesstracker')
