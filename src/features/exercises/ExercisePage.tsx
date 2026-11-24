/**
 * BodyBuddy-Client/src/Features/exercises/ExerciseScreen.tsx (route /exercise/[exerciseId]) with
 * Buttons, Information, TabsMenager, Instractions, ExerciseHistory, ExerciseImageCarousel and
 * workoutsPlans/PlansSelector + Card. Same layout, classes and texts.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, Dumbbell, Loader2, Plus, ShieldAlert, Star, UserPen } from 'lucide-react'
import { useProfile } from '../profile/useProfileData'
import { isCustomId } from '../workouts/api'
import { usePlans } from '../workouts/hooks'
import { formatFieldValue, formatMinutesHebrew } from '../workouts/format'
import { GraphData } from '../workouts/review/ExercisesProgress'
import { ActionButton, CloseButton, Loading } from '../workouts/ui/primitives'
import type { Plan } from '../workouts/types'
import { IconAddToList, IconAddToListFitness, IconsFitnessTools, IconSearchGoogle, IconSecondaryMuscle, IconShare } from '../../shared/icons/BodyBuddyIcons'
import { MiniAvatar } from './avatar/BodyAvatar'
import { BACK_BODY_MUSCLES, FRONT_BODY_MUSCLES, targetMuscleToBodyParts, type BodyPart } from './avatar/types'
import { useFavoriteIds, useToggleFavorite } from './useFavorites'
import { useAddExerciseToPlans, useExerciseDetail, useExerciseHistory, useRemoveExerciseFromPlan, type ExerciseDetail } from './useExerciseDetail'
import { thumbnailUrl } from '../workouts/picker/usePickerExercises'

const SHARE_BASE_URL = 'https://bodybuddy.fitness/share'
const background =
  'bg-[linear-gradient(to_bottom,theme(colors.background.900),theme(colors.background.950),theme(colors.background.800),theme(colors.background.700))]'

export function ExercisePage() {
  const { exerciseId = '' } = useParams()
  const navigate = useNavigate()
  const { data: exercise, isPending, isError, refetch } = useExerciseDetail(exerciseId)
  const { data: profile } = useProfile()
  const [showTooltip, setShowTooltip] = useState(false)
  const isCustom = isCustomId(exerciseId)
  // Opened from a link with nothing behind it — go to the exercises tab instead
  const handleClose = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/exercises', { replace: true }))

  if (!exercise && !isPending) {
    return (
      <div className={`flex h-dvh flex-col items-center justify-center gap-4 px-8 ${background}`}>
        {isError ? (
          <>
            <p className="typo-h4 text-center text-heading">לא הצלחנו לטעון את התרגיל</p>
            <p className="typo-label text-center text-background-300">בדוק את החיבור לאינטרנט ונסה שוב.</p>
            <ActionButton onPress={() => void refetch()} label="נסה שוב" variant="outline" size="sm" />
            <ActionButton onPress={handleClose} label="חזרה" variant="secondary" size="sm" ariaLabel="חזרה למסך הקודם" />
          </>
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <Dumbbell size={32} className="text-lime-500" />
            <p className="typo-h4 mt-3 text-center text-heading">התרגיל לא נמצא</p>
            <p className="typo-label mb-4 mt-1 text-center text-background-300">ייתכן שהתרגיל נמחק או שהקישור כבר לא תקף.</p>
            <ActionButton onPress={handleClose} label="חזרה" variant="secondary" size="sm" />
          </div>
        )}
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className={`flex h-dvh items-center justify-center ${background}`}>
        <span className="typo-h4 text-heading">טוען נתונים...</span>
      </div>
    )
  }

  const hasInstructions = exercise.instructions_he.length > 0
  const tabs = [
    { title: 'היסטוריה', content: <ExerciseHistory exercise={exercise} /> },
    ...(hasInstructions ? [{ title: 'הוראות', content: <Instructions instructions={exercise.instructions_he} /> }] : []),
  ]
  const gender = profile?.gender === 'male' || profile?.gender === 'female' ? profile.gender : undefined

  return (
    <div className={`flex h-dvh flex-col pt-[env(safe-area-inset-top,0px)] ${background}`}>
      <div className="mt-3 flex items-center px-4">
        <div className="flex flex-1 justify-center"><span aria-hidden className="h-1.5 w-10 rounded-full bg-lime-500" /></div>
        <CloseButton onPress={handleClose} label="סגור" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]">
        <div className="mb-8 mt-5 w-full px-6">
          <button type="button" onClick={() => setShowTooltip(true)} title="לחץ לצפייה בשם המלא" className="block w-full text-start">
            <h1 className="typo-h1 truncate leading-tight text-heading">{exercise.name_he}</h1>
          </button>
          {isCustom && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-1">
              <UserPen size={12} className="text-lime-400" />
              <span className="typo-caption text-lime-400">תרגיל אישי שהוספת</span>
            </span>
          )}
          <span aria-hidden className="mt-2 block h-1 w-20 rounded-full bg-lime-500" />
        </div>

        <div className="mx-auto flex h-[280px] w-[95%] items-center justify-center rounded-[32px] bg-black p-2 shadow-[0_10px_20px] shadow-lime-500/20">
          <ExerciseMedia exercise={exercise} isCustom={isCustom} />
        </div>

        <div className="mt-3 min-h-[600px] w-full">
          <ActionButtons exercise={exercise} />
          <Information exercise={exercise} gender={gender} />
          <TabsManager key={exercise.exerciseId} tabs={tabs} initialTab={hasInstructions ? 1 : 0} />
        </div>

        {/* Support & disclaimer */}
        <div className="mb-8 mt-4 px-6">
          <p className="typo-label text-start text-background-400">
            {'נתקלת בבעיה? '}
            <a href="mailto:bodybuddysupport@gmail.com" className="font-semibold text-lime-400">דווחו לנו</a>
          </p>
          <div className="mt-4 flex items-start gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <ShieldAlert size={20} className="flex-shrink-0 text-background-400" aria-hidden />
            <div className="flex-1">
              <p className="typo-label text-start text-background-300">
                {isCustom
                  ? 'ביצוע התרגיל הוא באחריותך הבלעדית. הקפד על טכניקה נכונה, התאם את העומס ליכולתך והפסק במקרה של כאב.'
                  : 'המידע בתרגיל זה כללי בלבד ואינו מהווה הדרכה אישית. ביצוע התרגיל הוא באחריותך הבלעדית – הקפד על טכניקה נכונה, התאם את העומס ליכולתך, הפסק במקרה של כאב והתייעץ עם איש מקצוע במקרה של ספק.'}
              </p>
              {!isCustom && (
                <p className="typo-caption mt-2 text-start text-background-400">
                  התרגילים נוצרו באמצעות בינה מלאכותית. תכני האפליקציה מוגנים בזכויות יוצרים ומותרים לשימוש בתוך האפליקציה בלבד.
                </p>
              )}
              <Link to="/terms-of-service" className="typo-caption-bold mt-2 block text-start text-lime-400">לתנאי השימוש</Link>
            </div>
          </div>
        </div>
      </div>

      {showTooltip && (
        <div role="dialog" aria-modal="true" aria-label={exercise.name_he} onClick={() => setShowTooltip(false)} className="fixed inset-0 z-[120] animate-[pageEnter_0.2s_ease_both] px-6 pt-[120px]">
          <div className="rounded-2xl border border-lime-500 bg-zinc-900 px-2 py-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <p className="typo-h3 flex-1 px-1 text-start text-heading">{exercise.name_he}</p>
              <CloseButton onPress={() => setShowTooltip(false)} label="סגור" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- media (video / carousel / image / placeholder) ----------

function ExerciseMedia({ exercise, isCustom }: { exercise: ExerciseDetail; isCustom: boolean }) {
  const [videoFailed, setVideoFailed] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [imgLoading, setImgLoading] = useState(true)
  const single = thumbnailUrl(exercise.imageUrls[0], 800)

  if (exercise.videoUrl && !videoFailed) {
    return (
      <video
        src={exercise.videoUrl}
        poster={thumbnailUrl(exercise.imageUrls[0], 700)}
        autoPlay
        muted
        loop
        playsInline
        aria-label={exercise.name_he}
        onError={() => setVideoFailed(true)}
        className="h-full w-full object-contain"
      />
    )
  }
  if (exercise.imageUrls.length > 1) return <ImageCarousel urls={exercise.imageUrls.map((u) => thumbnailUrl(u, 800) as string)} />
  if (single && !imgError) {
    return (
      <span className="relative h-full w-full">
        <img
          src={single}
          alt={exercise.name_he}
          onLoad={() => setImgLoading(false)}
          onError={() => { setImgError(true); setImgLoading(false) }}
          className="h-full w-full object-contain"
        />
        {imgLoading && <span className="pointer-events-none absolute inset-0 flex items-center justify-center"><Loader2 size={36} className="animate-spin text-lime-500" /></span>}
      </span>
    )
  }
  return (
    <span className="flex flex-col items-center">
      <Dumbbell size={120} className="animate-bb-nudge text-lime-500" aria-hidden />
      <span className="typo-label mt-1 text-zinc-400">{isCustom ? 'לתרגיל זה לא נוספה עדיין תמונה' : 'תרגיל זה אינו זמין כרגע'}</span>
    </span>
  )
}

/** ExerciseImageCarousel.tsx — swipeable pages + dots */
function ImageCarousel({ urls }: { urls: string[] }) {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const onScroll = () => {
    const el = ref.current
    if (el) setActive(Math.round(Math.abs(el.scrollLeft) / el.clientWidth))
  }
  return (
    <div className="relative h-full w-full" aria-label="גלריית תמונות התרגיל">
      <div ref={ref} onScroll={onScroll} className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]">
        {urls.map((u) => (
          <img key={u} src={u} alt="תמונת התרגיל" className="h-full w-full flex-shrink-0 snap-center object-contain" />
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
        {urls.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-[3px] transition-all ${i === active ? 'w-4 bg-lime-300' : 'w-1.5 bg-white/30'}`} />
        ))}
      </div>
    </div>
  )
}

// ---------- Buttons.tsx ----------

function ActionButtons({ exercise }: { exercise: ExerciseDetail }) {
  const { data: favorites = [] } = useFavoriteIds()
  const toggleFavorite = useToggleFavorite()
  const { data: profile } = useProfile()
  const isFav = favorites.includes(exercise.exerciseId)
  const [plansOpen, setPlansOpen] = useState(false)
  const [favBurst, setFavBurst] = useState(0)
  const canShare = !isCustomId(exercise.exerciseId)

  const handleShare = async () => {
    const sender = (profile as { full_name?: string | null } | null | undefined)?.full_name?.trim().split(/\s+/)[0]
    const url = `${SHARE_BASE_URL}?e=${encodeURIComponent(exercise.exerciseId)}`
    const text = `${exercise.name_he}\n${sender ? `תרגיל ששותף איתך על ידי ${sender}\n` : ''}צפה בתרגיל ובהוראות ב-BodyBuddy:\n${url}`
    if (navigator.share) await navigator.share({ title: `שיתוף תרגיל: ${exercise.name_he}`, text }).catch(() => {})
    else await navigator.clipboard?.writeText(text)
  }

  const buttons: { icon: ReactNode; text: string; onPress: () => void }[] = [
    {
      icon: <IconSearchGoogle size={20} className="fill-lime-500" />,
      text: 'גוגל',
      onPress: () => window.open(`https://www.google.com/search?q=${encodeURIComponent(`${exercise.name} exercise`)}`, '_blank', 'noopener'),
    },
    { icon: <IconAddToListFitness size={20} className="fill-lime-500" />, text: 'הוסף', onPress: () => setPlansOpen(true) },
    ...(canShare ? [{ icon: <IconShare size={20} className="fill-lime-500" />, text: 'שתף', onPress: () => void handleShare() }] : []),
    {
      icon: (
        <span className="relative flex">
          {favBurst > 0 && <span key={favBurst} aria-hidden className="absolute -inset-1 animate-bb-burst rounded-full border-2 border-lime-400" />}
          <Star size={20} className={isFav ? 'fill-lime-400 text-lime-400' : 'text-lime-500'} />
        </span>
      ),
      text: 'מועדף',
      onPress: () => { setFavBurst((n) => n + 1); toggleFavorite.mutate({ exerciseId: exercise.exerciseId, isFav }) },
    },
  ]

  return (
    <div>
      <div className="mb-5 mt-2 flex w-full justify-between px-6">
        {buttons.map((b) => (
          <button key={b.text} type="button" onClick={b.onPress} aria-label={b.text} className="flex flex-1 flex-col items-center gap-1 active:opacity-60">
            <span className="rounded-2xl border border-lime-500/35 bg-lime-500/10 p-2.5">{b.icon}</span>
            <span className="typo-caption text-background-300">{b.text}</span>
          </button>
        ))}
      </div>
      {plansOpen && <PlanSelector exerciseId={exercise.exerciseId} onClose={() => setPlansOpen(false)} />}
    </div>
  )
}

// ---------- Information.tsx ----------

function Information({ exercise, gender }: { exercise: ExerciseDetail; gender?: 'male' | 'female' }) {
  const targetParts = useMemo(() => {
    const parts = new Set<BodyPart>()
    exercise.targetMuscles.forEach((m) => (targetMuscleToBodyParts[m] ?? []).forEach((p) => parts.add(p)))
    return [...parts]
  }, [exercise.targetMuscles])
  const preferBack = exercise.targetMuscles.some((m) => BACK_BODY_MUSCLES.has(m)) && !exercise.targetMuscles.some((m) => FRONT_BODY_MUSCLES.has(m))

  return (
    <div className="mt-4 flex w-full flex-col gap-3 px-5">
      <div className="flex items-center rounded-3xl border border-zinc-800 bg-zinc-900/50 p-4">
        {gender && targetParts.length > 0 && <MiniAvatar selectedParts={targetParts} gender={gender} preferBack={preferBack} />}
        <div className="ms-4 flex flex-1 flex-col items-start">
          <span className="typo-caption-bold mb-1 uppercase tracking-tighter text-zinc-500">שריר עיקרי</span>
          <span className="typo-h4 text-heading">{exercise.targetMuscles_he.length > 0 ? exercise.targetMuscles_he.join(', ') : 'לא צויין'}</span>
        </div>
      </div>
      <div className="flex gap-3">
        <InfoCard icon={<IconsFitnessTools size={20} className="fill-lime-300" />} label="ציוד" value={exercise.equipments_he.length > 0 ? exercise.equipments_he.join(', ') : 'לא צויין'} />
        <InfoCard icon={<IconSecondaryMuscle size={20} className="fill-lime-300" />} label="מסייעים" value={exercise.secondaryMuscles_he.length > 0 ? exercise.secondaryMuscles_he.join(', ') : 'ללא'} />
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-start rounded-3xl border border-zinc-800 bg-zinc-900/50 p-4">
      <span className="mb-3 rounded-xl bg-zinc-800 p-2">{icon}</span>
      <span className="typo-caption-bold mb-1 uppercase text-zinc-500">{label}</span>
      <span className="typo-label w-full truncate text-heading">{value}</span>
    </div>
  )
}

// ---------- TabsMenager.tsx ----------

function TabsManager({ tabs, initialTab = 0 }: { tabs: { title: string; content: ReactNode }[]; initialTab?: number }) {
  const [active, setActive] = useState(Math.min(initialTab, tabs.length - 1))
  const startX = useRef<number | null>(null)
  const two = tabs.length === 2

  // Swipe between tabs (PanGestureHandler, 50px threshold; RTL — swiping left goes forward)
  const onTouchEnd = (x: number) => {
    if (startX.current === null) return
    const dx = x - startX.current
    startX.current = null
    if (dx < -50 && active + 1 < tabs.length) setActive(active + 1)
    else if (dx > 50 && active > 0) setActive(active - 1)
  }

  return (
    <div className="w-full">
      <div className="relative mx-6 mb-2 mt-4 flex h-12 items-center overflow-hidden rounded-full border border-zinc-800 bg-background-850 p-1">
        <span
          aria-hidden
          className={`pointer-events-none absolute right-1 top-1 h-10 rounded-3xl border border-lime-500 bg-background-700 transition-transform duration-300 ${two ? 'w-[calc(50%-4px)]' : 'w-[calc(100%-8px)]'} ${active === 1 ? '-translate-x-full' : ''}`}
        />
        {tabs.map((t, i) => (
          <button key={t.title} type="button" onClick={() => setActive(i)} aria-pressed={active === i} className="z-10 flex h-full flex-1 items-center justify-center">
            <span className={`typo-body-primary ${active === i ? 'text-lime-500' : 'text-zinc-500'}`}>{t.title}</span>
          </button>
        ))}
      </div>
      <div className="p-6" onTouchStart={(e) => (startX.current = e.touches[0].clientX)} onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}>
        {tabs[active]?.content}
      </div>
    </div>
  )
}

// ---------- Instractions.tsx ----------

function Instructions({ instructions }: { instructions: string[] }) {
  return (
    <div className="px-5 py-4">
      <div className="mb-6 flex items-center gap-4">
        <span aria-hidden className="me-3 h-6 w-1 rounded-full bg-lime-500" />
        <h2 className="typo-h3 text-heading">שלבי ביצוע</h2>
      </div>
      <ol>
        {instructions.map((step, i) => (
          <li key={`${i}-${step.slice(0, 20)}`} className="mb-6 flex">
            <span className="relative me-4 flex flex-col items-center">
              <span className="z-10 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
                <span className="typo-h4 text-lime-500">{i + 1}</span>
              </span>
              {i !== instructions.length - 1 && <span aria-hidden className="absolute top-10 h-full w-px bg-zinc-800" />}
            </span>
            <p className="typo-body-primary flex-1 self-start rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-4 text-start leading-6 text-zinc-200 shadow-sm">{step}</p>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex items-center rounded-2xl border border-lime-500/20 bg-lime-500/10 p-4">
        <p className="typo-label flex-1 text-start text-lime-500">שימו לב לשמור על טכניקה נכונה לאורך כל הסט. במידה ואתם מרגישים כאב חד - הפסיקו מיד.</p>
      </div>
    </div>
  )
}

// ---------- ExerciseHistory.tsx ----------

function ExerciseHistory({ exercise }: { exercise: ExerciseDetail }) {
  const { data: progress, isPending, isError, refetch } = useExerciseHistory(exercise.exerciseId)
  const fields = exercise.input_fields

  if (isError && !progress) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <p className="typo-body text-center text-zinc-400">אין חיבור לשרת</p>
        <ActionButton onPress={() => void refetch()} label="נסה שוב" variant="outline" size="sm" />
      </div>
    )
  }
  if (isPending) return <Loading />
  if (!progress || progress.sessions.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center p-6">
        <p className="typo-body whitespace-pre-line text-center text-zinc-500">{'לא בוצע תרגיל זה עדיין.\nהתחל לאמן ותראה את ההתקדמות כאן!'}</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-start px-4 pb-8 pt-4">
      <h3 className="typo-body-primary mb-3 text-heading">שיאים אישיים</h3>
      <div className="mb-6 flex w-full gap-3">
        {fields.map((f) => <PRCard key={f.key} label={`${f.label} מקס'`} value={formatFieldValue(f, progress.maxima[f.key] ?? 0)} />)}
        <PRCard label="סטים מקס'" value={String(progress.max_sets)} />
      </div>
      <h3 className="typo-body-primary mb-3 text-heading">התקדמות לאורך זמן</h3>
      <GraphData sessions={progress.sessions} fields={fields} />
    </div>
  )
}

function PRCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-2xl border border-zinc-700/50 bg-zinc-800/60 p-4">
      <span className="typo-caption mb-1 text-zinc-400">{label}</span>
      <span dir="ltr" className="typo-h2 text-lime-500">{value}</span>
    </div>
  )
}

// ---------- workoutsPlans/PlansSelector.tsx + Card.tsx ----------

function PlanSelector({ exerciseId, onClose }: { exerciseId: string; onClose: () => void }) {
  const navigate = useNavigate()
  const { data: plans, isPending, isError, refetch } = usePlans()
  const add = useAddExerciseToPlans()
  const remove = useRemoveExerciseFromPlan()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const removingPlanId = remove.isPending ? remove.variables?.planId : undefined
  const isAddedToAll = !!plans?.length && plans.every((p) => p.exercise_ids?.includes(exerciseId))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const toggle = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  const save = () => {
    if (!selectedIds.length) return
    add.mutate({ exerciseId, planIds: selectedIds }, { onSuccess: onClose })
  }
  const saveLabel = selectedIds.length === 0 ? 'בחר תוכנית' : selectedIds.length === 1 ? 'הוסף לתוכנית אחת' : `הוסף ל-${selectedIds.length} תוכניות`

  return (
    <>
      <button type="button" aria-label="סגור" onClick={onClose} className="fixed inset-0 z-[115] cursor-default bg-black/40" />
      <div role="dialog" aria-modal="true" aria-label="הוספה לתוכנית" className="fixed inset-x-0 bottom-0 z-[116] flex h-[60dvh] animate-[trayIn_0.28s_ease] flex-col overflow-hidden rounded-t-[28px] bg-background-900 shadow-[0_-8px_24px] shadow-lime-500/15">
        {isPending || (isError && !plans) ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            {isError ? (<><p className="typo-body text-zinc-400">אין חיבור לשרת</p><ActionButton onPress={() => void refetch()} label="נסה שוב" variant="outline" size="sm" /></>) : <Loading />}
          </div>
        ) : (
          <>
            <div className="flex justify-center pb-1 pt-3"><span className="h-1 w-10 rounded-full bg-zinc-700" /></div>
            <div className="flex items-center justify-between px-4 pb-4 pt-2">
              {!!plans?.length && (
                <div className="flex flex-1 flex-col items-start">
                  <h2 className="typo-h3 text-heading">הוספה לתוכנית</h2>
                  <p className="typo-label mt-0.5 text-background-300">בחר תוכנית אחת או יותר</p>
                </div>
              )}
              <CloseButton onPress={onClose} label="סגור" />
            </div>
            <div className="mx-6 h-px bg-zinc-800/60" />
            <div className="mt-2 min-h-0 flex-1">
              {plans?.length ? (
                <div className="flex h-full flex-col gap-2.5 overflow-y-auto px-4 pb-[calc(100px+env(safe-area-inset-bottom,0px))] pt-3">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      exerciseId={exerciseId}
                      selected={selectedIds.includes(plan.id)}
                      onToggle={toggle}
                      onRemove={(planId) => remove.mutate({ exerciseId, planId })}
                      isRemoving={removingPlanId === plan.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-8">
                  <span className="mb-5 rounded-full bg-background-800 p-7 opacity-80"><IconsFitnessTools size={36} className="fill-lime-500" /></span>
                  <p className="typo-h4 mb-2 text-center text-heading">עדיין אין לך תוכניות אימון</p>
                  <p className="typo-label mb-8 whitespace-pre-line text-center leading-5 text-zinc-500">{'זה הזמן ליצור את האימון הראשון שלך\nולהתחיל להתקדם למטרה!'}</p>
                  <button type="button" onClick={() => navigate('/workout')} className="flex items-center gap-2 rounded-full border border-lime-500 bg-background-700 px-4 py-2 active:scale-95">
                    <IconAddToList size={18} className="fill-lime-300" />
                    <span className="typo-btn-cta text-lime-300">עבור ליצירת תוכנית</span>
                  </button>
                </div>
              )}
            </div>
            {!!plans?.length && !isAddedToAll && (
              <div className="absolute bottom-[calc(16px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 rounded-full bg-background-900">
                <ActionButton onPress={save} label={saveLabel} icon={Plus} variant="soft" size="sm" loading={add.isPending} disabled={selectedIds.length === 0} />
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

function PlanCard({ plan, exerciseId, selected, onToggle, onRemove, isRemoving }: {
  plan: Plan; exerciseId: string; selected: boolean; onToggle: (id: string) => void; onRemove: (id: string) => void; isRemoving: boolean
}) {
  const count = plan.exercise_ids?.length ?? 0
  if (plan.exercise_ids?.includes(exerciseId)) {
    const position = plan.exercise_ids.indexOf(exerciseId) + 1
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-lime-500/30 bg-lime-500/[0.08] p-4" aria-label={`${plan.title} - התרגיל כבר בתוכנית`}>
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <span className="typo-body-primary w-full truncate text-heading">{plan.title}</span>
          <span className="typo-caption mt-1 text-lime-400">{position > 0 ? `כבר בתוכנית · תרגיל ${position} מתוך ${count}` : 'כבר בתוכנית'}</span>
        </div>
        <button type="button" onClick={() => onRemove(plan.id)} disabled={isRemoving} aria-label={`הסר את התרגיל מ${plan.title}`} className="flex h-11 items-center justify-center rounded-full border border-white/10 px-4">
          {isRemoving ? <Loader2 size={18} className="animate-spin text-background-400" /> : <span className="typo-label text-background-300">הסר</span>}
        </button>
      </div>
    )
  }
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={plan.title}
      onClick={() => onToggle(plan.id)}
      className={`flex w-full items-center gap-3 rounded-3xl border p-4 text-start ${selected ? 'border-lime-500/45 bg-background-800' : 'border-white/[0.07] bg-white/[0.03]'}`}
    >
      <span className="flex min-w-0 flex-1 flex-col items-start">
        <span className={`typo-body-primary w-full truncate ${selected ? 'text-heading' : 'text-background-200'}`}>{plan.title}</span>
        <span className="typo-caption mt-1 text-background-300">{count} תרגילים · {formatMinutesHebrew(plan.time ?? 0)}</span>
      </span>
      <span className={`flex h-[26px] w-[26px] items-center justify-center rounded-full ${selected ? 'border border-lime-500/60 bg-lime-500/25' : 'border-2 border-background-500'}`} aria-hidden>
        {selected && <Check size={14} strokeWidth={3} className="text-lime-300" />}
      </span>
    </button>
  )
}
