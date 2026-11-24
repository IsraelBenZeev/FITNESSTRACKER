/**
 * The user tab — BodyBuddy-Client/src/Features/auth/ProfileScreen.tsx, without notification settings:
 * who (photo, name, email, hold-to-sign-out, details), weekly summary carousel (workouts / nutrition),
 * my data, AI credits (disabled on the web), my exercises, delete account, privacy / terms, support.
 */
import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft, Dumbbell, Hand, LogOut, Pencil, Trash2, User } from 'lucide-react'
import { useBodyBuddyAuth } from '../../lib/BodyBuddyAuthContext'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { HoldButton } from '../../ui/motion'
import { triggerFeedback } from '../../store/uiStore'
import { LevelBars, Loading } from '../workouts/ui/primitives'
import { draftStore, shouldShowWorkoutBubble, type WorkoutDraft } from '../workouts/draftStore'
import { signOut } from '../auth/authService'
import { todayLocal } from '../../lib/date'
import { ACTIVITY_LEVELS, GENDER_LABELS, useAICredits, useDeleteAccount, useProfile, useWeeklyProgress, type Profile } from './useProfileData'
import { CreditsCard, WeeklyNutritionCard, WeeklyWorkoutsCard } from './widgets'
import { PagedCardCarousel } from '../../ui/motion'
import { WeeklyWorkoutsSheet } from './WeeklyWorkoutsSheet'
import { MyCustomExercisesSheet, MyCustomExercisesTrigger } from './MyCustomExercises'
import { PersonalDetailsSheet } from './PersonalDetailsSheet'

const SUPPORT_EMAIL = 'bodybuddysupport@gmail.com'

/** FadeInDown with a stagger, like the app's AnimatedCard */
function AnimatedCard({ delay, className = '', children }: { delay: number; className?: string; children: ReactNode }) {
  return (
    <div className={`animate-[bbFadeInDown_300ms_cubic-bezier(0.33,1,0.68,1)_both] motion-reduce:animate-none ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

const ageOf = (p: Profile | null | undefined): string => {
  if (p?.date_of_birth) {
    const dob = new Date(p.date_of_birth)
    if (!Number.isNaN(dob.getTime())) {
      const now = new Date()
      let age = now.getFullYear() - dob.getFullYear()
      if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--
      return String(age)
    }
  }
  return p?.age != null ? String(p.age) : '--'
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { bbUser: user } = useBodyBuddyAuth()
  const { data: profile, isLoading } = useProfile()
  const { data: credits } = useAICredits()
  const progress = useWeeklyProgress()
  const deleteAccount = useDeleteAccount()

  const [pressingLogout, setPressingLogout] = useState(false)
  const [openDraft, setOpenDraft] = useState<WorkoutDraft | null>(null)
  const [weeklyOpen, setWeeklyOpen] = useState(false)
  const [exercisesOpen, setExercisesOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const meta = user?.user_metadata ?? {}
  const avatarUrl = profile?.avatar_url ?? (meta.avatar_url as string | undefined) ?? (meta.picture as string | undefined)
  const fullName = profile?.full_name ?? (meta.full_name as string | undefined) ?? ''
  const activityIndex = ACTIVITY_LEVELS.findIndex((o) => o.value === profile?.activity_level) + 1
  const activityLabel = ACTIVITY_LEVELS.find((o) => o.value === profile?.activity_level)?.label ?? '--'

  const bodyStats = useMemo(
    () => [
      { key: 'weight', label: 'משקל', value: profile?.weight != null ? String(profile.weight) : '--', unit: 'ק״ג' },
      { key: 'height', label: 'גובה', value: profile?.height != null ? String(profile.height) : '--', unit: 'ס״מ' },
      { key: 'age', label: 'גיל', value: ageOf(profile), unit: '' },
      { key: 'gender', label: 'מגדר', value: GENDER_LABELS[profile?.gender ?? ''] ?? '--', unit: '' },
    ],
    [profile],
  )

  const performLogout = async () => {
    const { error } = await signOut()
    triggerFeedback(error ? 'שגיאה' : 'התנתקת בהצלחה', error ? 'failed' : 'success')
  }

  // An unfinished workout: ask what to do with it before signing out
  const handleLogout = () => {
    const draft = draftStore.get().draft
    if (draft && draft.userId === user?.id && shouldShowWorkoutBubble(draft)) {
      setOpenDraft(draft)
      return
    }
    void performLogout()
  }

  const confirmDelete = () =>
    deleteAccount.mutate(undefined, {
      onError: () => triggerFeedback('שגיאה במחיקת החשבון', 'failed'),
      onSettled: () => setDeleteOpen(false),
    })

  return (
    <>
      <div className="mx-auto flex w-full max-w-[640px] flex-col pb-10 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
        {/* Who */}
        <header className="px-7">
          <div className="flex items-center gap-4">
            <AnimatedCard delay={0} className="flex-shrink-0 rounded-full border-2 border-lime-500/30 p-1">
              {avatarUrl ? (
                <img src={avatarUrl} alt="תמונת הפרופיל שלך" referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-500/10 text-lime-500"><User size={32} /></span>
              )}
            </AnimatedCard>
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <AnimatedCard delay={80}><p className="typo-label text-white/40">הפרופיל שלי</p></AnimatedCard>
              <AnimatedCard delay={160} className="w-full"><h1 className="typo-h1 truncate tracking-tight text-heading">{fullName}</h1></AnimatedCard>
              {user?.email && (
                <AnimatedCard delay={200} className="w-full"><p dir="ltr" className="typo-caption truncate text-end text-background-400">{user.email}</p></AnimatedCard>
              )}
              <AnimatedCard delay={240} className="relative mt-3">
                {/* Shown only while pressing */}
                {pressingLogout && (
                  <span role="status" className="absolute bottom-full mb-2 flex w-max animate-[pageEnter_150ms_ease] flex-col items-center">
                    <span className="flex items-center gap-2 rounded-full border border-zinc-600 bg-zinc-800 px-4 py-2">
                      <Hand size={16} className="text-danger" aria-hidden />
                      <span className="typo-caption text-zinc-300">המשך להחזיק להתנתקות</span>
                    </span>
                    <span aria-hidden className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-zinc-600" />
                  </span>
                )}
                <div className="flex items-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                  <HoldButton
                    onComplete={handleLogout}
                    onPressIn={() => setPressingLogout(true)}
                    onPressOut={() => setPressingLogout(false)}
                    holdMs={1000}
                    label="החזק להתנתקות"
                    className="flex h-11 items-center justify-center px-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-danger"
                  >
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-danger/[0.14] text-danger"><LogOut size={15} /></span>
                      <span className="typo-label text-danger">התנתקות</span>
                    </span>
                  </HoldButton>
                  <span aria-hidden className="h-5 w-px bg-white/15" />
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(true)}
                    aria-label="פרטים אישיים"
                    className="flex h-11 items-center justify-center gap-1.5 px-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime-500"
                  >
                    <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-white/60"><User size={15} /></span>
                    <span className="typo-label text-white/50">פרטים</span>
                  </button>
                </div>
              </AnimatedCard>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="mt-24 flex justify-center"><Loading size={80} /></div>
        ) : (
          <div className="mt-6 flex flex-col px-6">
            <AnimatedCard delay={200} className="mb-3">
              <h2 className="typo-h3 mb-3 text-heading">סיכום שבועי</h2>
              <PagedCardCarousel
                label="סיכומים שבועיים: אימונים ותזונה"
                pages={[
                  <WeeklyWorkoutsCard key="workouts" progress={progress} onDetails={() => setWeeklyOpen(true)} />,
                  <WeeklyNutritionCard
                    key="nutrition"
                    onHistory={() => navigate('/profile/nutrition-history')}
                    onOpenDay={(date) => navigate(date === todayLocal() ? '/today' : `/profile/nutrition-history?day=${date}`)}
                  />,
                ]}
              />
            </AnimatedCard>

            {/* Nutrition history — always visible, not only on the carousel's second card */}
            <AnimatedCard delay={260} className="mb-4">
              <button
                type="button"
                onClick={() => navigate('/profile/nutrition-history')}
                className="flex w-full items-center gap-3 rounded-3xl border border-white/5 bg-background-800 p-4 text-start transition-colors duration-200 hover:border-lime-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
              >
                <span aria-hidden className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-lime-500/15 text-lime-300"><CalendarDays size={20} /></span>
                <span className="flex flex-1 flex-col items-start">
                  <span className="typo-h4 text-heading">היסטוריית תזונה</span>
                  <span className="typo-caption text-background-400">לוח חודשי, יעדים וייצוא נתונים</span>
                </span>
                <ChevronLeft size={18} className="text-background-400" aria-hidden />
              </button>
            </AnimatedCard>

            {/* My data — body stats and activity level */}
            <AnimatedCard delay={320} className="mb-4 rounded-[30px] border border-white/5 bg-background-800 p-5">
              <div className="flex min-h-[44px] items-center justify-between">
                <h2 className="typo-h4 text-heading">הנתונים שלי</h2>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  aria-label="עריכת נתונים אישיים"
                  className="typo-label flex min-h-[44px] items-center gap-2 px-1 text-lime-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
                >
                  <Pencil size={16} aria-hidden />
                  עריכה
                </button>
              </div>
              <div className="flex flex-col items-center gap-3 pt-2" aria-label={`רמת פעילות: ${activityLabel}`} role="group">
                <p className="typo-label text-background-400" aria-hidden>רמת פעילות</p>
                <LevelBars level={activityIndex} startDelay={650} barWidth={12} minBarHeight={12} heightStep={7} />
                <p className="typo-label text-heading" aria-hidden>{activityLabel}</p>
              </div>
              <span aria-hidden className="mt-5 block h-px bg-white/5" />
              <dl className="mt-5 flex">
                {bodyStats.map((s) => (
                  <div key={s.key} className="flex flex-1 flex-col items-start">
                    <dt className="typo-caption text-background-400">{s.label}</dt>
                    <dd className="mt-1 flex items-baseline gap-1">
                      <span className="typo-h3 text-heading">{s.value}</span>
                      {s.unit && <span className="typo-caption text-background-400">{s.unit}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </AnimatedCard>

            <AnimatedCard delay={560} className="mb-4">
              <CreditsCard credits={credits} />
            </AnimatedCard>

            <AnimatedCard delay={800}>
              <MyCustomExercisesTrigger onOpen={() => setExercisesOpen(true)} />
            </AnimatedCard>
          </div>
        )}

        <div className="mb-8 mt-6 px-6">
          {/* Danger zone — delete account */}
          <AnimatedCard delay={900}>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteAccount.isPending}
              aria-busy={deleteAccount.isPending}
              className="flex w-full items-center gap-3 rounded-3xl border border-danger/[0.22] bg-danger/[0.045] p-4 text-start transition-colors hover:bg-danger/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger"
            >
              <span aria-hidden className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-danger/15 text-danger"><Trash2 size={16} /></span>
              <span className="flex flex-1 flex-col items-start">
                <span className="typo-body-primary text-danger">{deleteAccount.isPending ? 'מוחק חשבון...' : 'מחיקת חשבון'}</span>
                <span className="typo-caption mt-0.5 text-background-400">פעולה זו בלתי הפיכה ותמחק את כל הנתונים שלך</span>
              </span>
              <ChevronLeft size={15} className="text-danger/55" aria-hidden />
            </button>
          </AnimatedCard>

          {/* Privacy policy and terms */}
          <AnimatedCard delay={950} className="mt-4">
            <nav aria-label="מסמכים משפטיים" className="flex w-full items-center justify-between overflow-hidden rounded-full border border-white/10 bg-white/5 px-4">
              <button type="button" onClick={() => navigate('/privacy-policy')} className="typo-label flex h-11 items-center justify-center whitespace-nowrap px-3 text-lime-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500">
                מדיניות הפרטיות
              </button>
              <span aria-hidden className="h-5 w-px bg-white/10" />
              <button type="button" onClick={() => navigate('/terms-of-service')} className="typo-label flex h-11 items-center justify-center whitespace-nowrap px-3 text-lime-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500">
                תנאי השימוש
              </button>
            </nav>
          </AnimatedCard>

          {/* Support */}
          <AnimatedCard delay={1000}>
            <p className="typo-label mt-4 text-center text-background-400">
              {'נתקלת בבעיה? '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-lime-400 underline-offset-2 hover:underline">צרו קשר עם התמיכה שלנו</a>
            </p>
          </AnimatedCard>
        </div>
      </div>

      <WeeklyWorkoutsSheet open={weeklyOpen} onClose={() => setWeeklyOpen(false)} workouts={progress.workouts} />
      <MyCustomExercisesSheet open={exercisesOpen} onClose={() => setExercisesOpen(false)} />
      <PersonalDetailsSheet open={detailsOpen} onClose={() => setDetailsOpen(false)} profile={profile ?? null} email={user?.email ?? null} fullName={fullName} />

      <ConfirmDialog
        visible={openDraft !== null}
        variant="info"
        icon={Dumbbell}
        title="יש לך אימון פתוח"
        message={`האימון "${openDraft?.planTitle ?? ''}" עדיין לא הסתיים. מה לעשות איתו לפני ההתנתקות?`}
        confirmLabel="המשך אימון"
        showCloseButton
        onCancel={() => setOpenDraft(null)}
        onConfirm={() => {
          const d = openDraft
          setOpenDraft(null)
          if (d) navigate(`/workout/plan/${d.planId}?resume=1`)
        }}
        secondaryAction={{
          label: 'מחק אימון והתנתק',
          tone: 'danger',
          onPress: () => {
            setOpenDraft(null)
            draftStore.clearDraft()
            void performLogout()
          },
        }}
      />

      <ConfirmDialog
        visible={deleteOpen}
        title="מחיקת חשבון לצמיתות"
        message="פעולה זו תמחק לצמיתות את החשבון שלך וכל המידע המשויך אליו — כולל אימונים, ארוחות והיסטוריית תזונה. לא ניתן לשחזר לאחר מכן."
        confirmLabel="מחק חשבון"
        isLoading={deleteAccount.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  )
}
