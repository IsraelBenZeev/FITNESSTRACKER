/**
 * Exercise picker — BodyBuddy-Client/src/Features/exercises/ExercisesScreen.tsx in mode 'picker'
 * (with CardExercise, Filters, SubBodyPartFilters, LocationFilter and the "selected exercises"
 * sheet that shows workoutsPlans/form/ListExercises). Same layout, classes, texts and filtering.
 */
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { BicepsFlexed, Check, ArrowRight, Star, PersonStanding, ChevronDown, ChevronLeft, ChevronUp, Dumbbell, Home, LayoutGrid, Search, SearchX, Target, X, XCircle, Construction, type LucideIcon } from 'lucide-react'
import { isCustomId } from '../api'
import { useExercisesByIds } from '../hooks'
import { ActionButton, CloseButton, Loading } from '../ui/primitives'
import { ExerciseDetailModal } from '../../workout/ExerciseDetailModal'
import { PARTS_HE, PICKER_BODY_PARTS, thumbnailUrl, useCatalogExercises, useUserCustomExercises, type PickerExercise } from './usePickerExercises'
import type { Exercise } from '../types'
import { useFavoriteIds, useToggleFavorite } from '../../exercises/useFavorites'
import { useProfile } from '../../profile/useProfileData'
import { MiniAvatar } from '../../exercises/avatar/BodyAvatar'
import type { BodyPart } from '../../exercises/avatar/types'

interface Props {
  isOpen: boolean
  selectedIds: string[]
  onToggle: (id: string) => void
  onClear: () => void
  onDone: () => void
}

type Location = 'all' | 'home' | 'gym'
type ListItem = { kind: 'exercise'; exercise: PickerExercise } | { kind: 'section-header'; label: string }

const PICKER_PARTS: string[] = [...PICKER_BODY_PARTS]
const HEBREW = /[֐-׿]/

/** Hebrew sub-area labels whose English key is valid (ExercisesScreen.getValidSubBodyPartLabels) */
const validSubLabels = (ex: PickerExercise) =>
  ex.subBodyParts_he
    .map((label, i) => ({ label: label?.trim(), key: ex.subBodyParts?.[i]?.trim() }))
    .filter(({ label, key }) => !!label && !!key && !HEBREW.test(key))
    .map(({ label }) => label as string)

export function ExercisePicker({ isOpen, selectedIds, onToggle, onClear, onDone }: Props) {
  if (!isOpen) return null
  return ReactDOM.createPortal(
    <PickerScreen selectedIds={selectedIds} onToggle={onToggle} onClear={onClear} onDone={onDone} />,
    document.body,
  )
}

/** ExercisesScreen in mode 'view' — the list the avatar screen opens (/exercises/list?parts=[...]) */
export function ExercisesListScreen({ parts }: { parts: BodyPart[] }) {
  return <PickerScreen mode="view" parts={parts} selectedIds={NO_IDS} onToggle={noop} onClear={noop} onDone={noop} />
}

const NO_IDS: string[] = []
const noop = () => {}

type ScreenProps = Omit<Props, 'isOpen'> & { mode?: 'picker' | 'view'; parts?: string[] }

function PickerScreen({ selectedIds, onToggle, onClear, onDone, mode = 'picker', parts: partsProp }: ScreenProps) {
  const isView = mode === 'view'
  const PARTS = partsProp ?? PICKER_PARTS
  const navigate = useNavigate()
  const { data: profile } = useProfile()
  const { data: favoriteIds = NO_IDS } = useFavoriteIds(isView)
  const toggleFavorite = useToggleFavorite()
  const favoritesSet = useMemo(() => new Set(favoriteIds), [favoriteIds])
  const isCardioOnly = PARTS.length === 1 && PARTS[0] === 'cardio'
  const selectedPartsText = PARTS.map((p) => PARTS_HE[p] ?? p).join(', ')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [selectedSub, setSelectedSub] = useState<string>('all')
  const [location, setLocation] = useState<Location>('all')
  const [search, setSearch] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)

  const main = useCatalogExercises(PARTS)
  // The main list pages through every area together, so an area's exercises may not be loaded
  // yet when it is picked — load the chosen area explicitly (same as the app)
  const loadPart = selectedFilter !== 'all'
  const part = useCatalogExercises(loadPart ? [selectedFilter] : [], loadPart)
  const { data: custom = [] } = useUserCustomExercises()

  const allExercises = useMemo(() => {
    const catalog = main.data?.pages.flat() ?? []
    const partCatalog = loadPart ? (part.data?.pages.flat() ?? []) : []
    const matchingCustom = custom.filter((e) => e.bodyParts.some((p) => PARTS.includes(p)))
    return Array.from(new Map([...catalog, ...partCatalog, ...matchingCustom].map((e) => [e.exerciseId, e])).values())
  }, [main.data, part.data, custom, loadPart])

  const exerciseIndex = useMemo(() => {
    const index = new Map<string, PickerExercise[]>([['all', allExercises]])
    for (const ex of allExercises)
      for (const p of ex.bodyParts) {
        if (!index.has(p)) index.set(p, [])
        index.get(p)!.push(ex)
      }
    return index
  }, [allExercises])

  // Indexed by the Hebrew label — several English keys map to the same label (e.g. rear delts)
  const subIndex = useMemo(() => {
    const base = exerciseIndex.get(selectedFilter) ?? []
    const index = new Map<string, PickerExercise[]>([['all', base]])
    for (const ex of base)
      for (const label of validSubLabels(ex)) {
        if (!index.has(label)) index.set(label, [])
        index.get(label)!.push(ex)
      }
    return index
  }, [exerciseIndex, selectedFilter])
  const subLabels = useMemo(() => [...subIndex.keys()].filter((k) => k !== 'all'), [subIndex])

  const deferredSub = useDeferredValue(selectedSub)
  const deferredSearch = useDeferredValue(search)

  const listItems = useMemo<ListItem[]>(() => {
    const bySub = subIndex.get(deferredSub) ?? subIndex.get('all') ?? []
    const byLocation = location === 'all' ? bySub : bySub.filter((e) => (location === 'home' ? e.homeFriendly : !e.homeFriendly))
    const q = deferredSearch.trim()
    const filtered = q ? byLocation.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()) || e.name_he.includes(deferredSearch)) : byLocation
    const items: ListItem[] = filtered.filter((e) => !isCustomId(e.exerciseId)).map((exercise) => ({ kind: 'exercise', exercise }))
    const customItems = filtered.filter((e) => isCustomId(e.exerciseId))
    if (customItems.length > 0) {
      items.push({ kind: 'section-header', label: 'תרגילים אישיים' })
      items.push(...customItems.map((exercise) => ({ kind: 'exercise' as const, exercise })))
    }
    return items
  }, [subIndex, deferredSub, location, deferredSearch])

  // view: the areas that actually have exercises (ExercisesScreen.uniqueBodyParts); picker: the given areas
  const filterParts = useMemo(
    () => (isView ? [...exerciseIndex.keys()].filter((k) => k !== 'all') : PARTS),
    [isView, exerciseIndex, PARTS],
  )
  const favoritesRef = useRef(favoritesSet)
  favoritesRef.current = favoritesSet
  const toggleFav = useCallback(
    (id: string) => toggleFavorite.mutate({ exerciseId: id, isFav: favoritesRef.current.has(id) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toggleFavorite.mutate],
  )

  // CardExercise in view mode: router.push(/exercise/[exerciseId])
  const openExercise = useCallback((ex: PickerExercise) => navigate(`/exercise/${encodeURIComponent(ex.exerciseId)}`), [navigate])

  const chooseFilter = useCallback((f: string) => { setSelectedFilter(f); setSelectedSub('all') }, [])

  // Infinite scroll (FlashList onEndReached, threshold 0.5)
  const listRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadMore = useCallback(() => {
    if (loadPart && part.hasNextPage && !part.isFetchingNextPage) return void part.fetchNextPage()
    if (main.hasNextPage && !main.isFetchingNextPage) void main.fetchNextPage()
  }, [loadPart, part, main])
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !listRef.current) return
    const io = new IntersectionObserver((e) => e[0]?.isIntersecting && loadMore(), { root: listRef.current, rootMargin: '0px 0px 50% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore])

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const count = selectedIds.length
  useEffect(() => { if (count === 0) setSheetOpen(false) }, [count])

  const isWaiting = !main.data

  return (
    <div
      dir="rtl"
      role={isView ? undefined : 'dialog'}
      aria-modal={isView ? undefined : true}
      aria-label={isView ? undefined : 'בחר תרגילים'}
      className={isView
        ? 'relative flex h-[calc(100dvh-80px)] min-h-0 flex-col bg-[linear-gradient(to_bottom,theme(colors.background.900),theme(colors.background.950),theme(colors.background.800),theme(colors.background.700))] pt-[env(safe-area-inset-top,0px)]'
        : 'fixed inset-0 z-[110] flex animate-[slideUp_0.22s_cubic-bezier(0.32,0.72,0,1)_forwards] flex-col bg-background-1200 pt-[env(safe-area-inset-top,0px)]'}
    >
      {isView && (
        <div className="pt-4">
          <div className="mb-6 flex items-center gap-4 px-6">
            <button type="button" onClick={() => navigate(-1)} aria-label="חזרה" className="flex h-[60px] w-[60px] flex-shrink-0 items-center justify-center rounded-full text-heading transition-transform active:scale-95 active:opacity-70">
              <ArrowRight size={40} />
            </button>
            {isCardioOnly ? (
              <span aria-label="אירובי" className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-full border border-lime-500/40 bg-lime-500/15 text-lime-400">
                <PersonStanding size={26} />
              </span>
            ) : (
              profile?.gender && <MiniAvatar selectedParts={PARTS as BodyPart[]} gender={profile.gender === 'female' ? 'female' : 'male'} />
            )}
            <div className="flex min-w-0 flex-1 flex-col items-start">
              <span className="typo-label uppercase tracking-widest text-lime-50">מתאמן על</span>
              <h1 className="typo-h3 line-clamp-2 text-heading" title={selectedPartsText}>{selectedPartsText}</h1>
            </div>
          </div>
        </div>
      )}
      {isWaiting ? (
        main.isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8">
            <p className="typo-h4 text-center text-heading">אין חיבור לשרת</p>
            <ActionButton onPress={() => void main.refetch()} label="נסה שוב" variant="outline" />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center"><Loading size={96} /></div>
        )
      ) : (
        <div className="relative flex min-h-0 flex-1 flex-col items-center px-1 pt-2">
          {!isView && (
            <>
              <span aria-hidden className="h-1.5 w-10 rounded-full bg-lime-500" />
              <div className="mb-4 w-full px-4">
                <h2 className="typo-h3 text-heading">בחר תרגילים</h2>
              </div>
            </>
          )}

          <div className="flex min-h-0 w-full flex-1 flex-col">
            {filterParts.length > 1 &&
              (selectedFilter === 'all' ? (
                <BodyPartFilters parts={filterParts} onSelect={chooseFilter} />
              ) : (
                <SubFilters items={subLabels} selected={selectedSub} onSelect={setSelectedSub} onBack={() => chooseFilter('all')} breadcrumb={PARTS_HE[selectedFilter] ?? selectedFilter} />
              ))}
            {filterParts.length === 1 && subLabels.length > 0 && (
              <SubFilters items={subLabels} selected={selectedSub} onSelect={setSelectedSub} />
            )}
            {allExercises.length > 0 && <LocationFilter selected={location} onSelect={setLocation} />}

            <div className="mx-2 mb-3 mt-2 flex items-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4">
              <Search size={18} className="flex-shrink-0 text-background-300" aria-hidden />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חפש תרגיל..."
                aria-label="חיפוש תרגיל"
                type="search"
                className="typo-input min-w-0 flex-1 bg-transparent px-2 py-3 text-heading placeholder:text-background-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {search.length > 0 && (
                <button type="button" onClick={() => setSearch('')} aria-label="נקה חיפוש" className="flex h-8 w-8 items-center justify-center text-background-300 active:opacity-60">
                  <XCircle size={18} />
                </button>
              )}
            </div>

            {!isView && (
            <div className="mx-2 mb-3 flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900 px-4 py-3">
              <button
                type="button"
                onClick={() => setSheetOpen((o) => !o)}
                disabled={count === 0}
                aria-label="הצג תרגילים נבחרים"
                aria-expanded={sheetOpen}
                className="flex items-center gap-2 active:opacity-60"
              >
                <span className={`ms-3 flex h-8 min-w-[32px] items-center justify-center rounded-full border px-2 ${count > 0 ? 'border-lime-500/50 bg-lime-500/20' : 'border-zinc-700 bg-transparent'}`}>
                  <span className={`typo-btn-secondary ${count > 0 ? 'text-lime-300' : 'text-zinc-400'}`}>{count}</span>
                </span>
                <span className="typo-btn-secondary text-zinc-300">תרגילים נבחרו</span>
                {count > 0 && (sheetOpen ? <ChevronUp size={14} className="text-lime-400" /> : <ChevronDown size={14} className="text-lime-400" />)}
              </button>
              {count > 0 && (
                <button type="button" onClick={onClear} aria-label="נקה כל הבחירות" className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-2 transition-transform active:scale-95">
                  <span className="typo-label text-danger">נקה הכל</span>
                </button>
              )}
            </div>
            )}

            <div ref={listRef} className="min-h-0 w-full flex-1 overflow-y-auto px-6">
              {listItems.length === 0 ? (
                allExercises.length === 0 ? (
                  <EmptyState icon={Construction} title="עדיין לא נוצרו תרגילים לאזור זה" description="הצוות שלנו עובד על זה, בקרוב יתווספו כאן תרגילים חדשים." />
                ) : (
                  <EmptyState icon={SearchX} title="לא נמצאו תרגילים" description="נסה לשנות את מילות החיפוש או להסיר חלק מהסינונים." />
                )
              ) : (
                listItems.map((item, i) =>
                  item.kind === 'section-header' ? (
                    <div key={`section-header-${i}`} className="px-2 pb-3 pt-2">
                      <span className="typo-caption-bold uppercase tracking-widest text-lime-400">{item.label}</span>
                    </div>
                  ) : (
                    <CardExercise
                      key={item.exercise.exerciseId}
                      item={item.exercise}
                      mode={mode}
                      selected={!isView && selectedSet.has(item.exercise.exerciseId)}
                      onToggle={onToggle}
                      onOpen={openExercise}
                      isFavorite={favoritesSet.has(item.exercise.exerciseId)}
                      onToggleFavorite={toggleFav}
                    />
                  ),
                )
              )}
              <div ref={sentinelRef} className="h-px" />
              {main.isFetchingNextPage || part.isFetchingNextPage ? (
                <div className="flex items-center justify-center py-6"><span className="typo-body text-lime-400">טוען תרגילים נוספים...</span></div>
              ) : (
                <div className="pb-24" />
              )}
            </div>
          </div>

          {!isView && (
            <div className="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom,0px)+40px)] left-0 right-0 flex justify-center px-10">
              <span className="pointer-events-auto">
                <ActionButton onPress={onDone} label="שמור וסיים" icon={Check} variant="primary" iconOnly />
              </span>
            </div>
          )}
        </div>
      )}

      {sheetOpen && <SelectedSheet ids={selectedIds} onToggle={onToggle} onClose={() => setSheetOpen(false)} />}
    </div>
  )
}

// ---------- CardExercise (mode 'picker') ----------

interface CardProps {
  item: PickerExercise
  mode: 'picker' | 'view'
  selected: boolean
  onToggle: (id: string) => void
  onOpen: (ex: PickerExercise) => void
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
}

const CardExercise = memo(function CardExercise({ item, mode, selected, onToggle, onOpen, isFavorite, onToggleFavorite }: CardProps) {
  const isView = mode === 'view'
  const [favBurst, setFavBurst] = useState(0)
  const press = () => (isView ? onOpen(item) : onToggle(item.exerciseId))
  const [imgError, setImgError] = useState(false)
  const src = thumbnailUrl(item.imageUrls[0], 170)
  const isCustom = isCustomId(item.exerciseId)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={press}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); press() } }}
      aria-pressed={isView ? undefined : selected}
      aria-label={`${item.name_he}${isCustom ? ', תרגיל אישי' : ''}${selected ? ', נבחר' : ''}`}
      className={`mb-4 flex w-full gap-3 rounded-[24px] border-[1.5px] p-3 text-start transition-colors active:opacity-70 ${selected ? 'border-lime-500 bg-zinc-800 shadow-[0_4px_8px] shadow-lime-500/20' : 'border-zinc-800 bg-zinc-900'}`}
    >
      <span className="relative h-[85px] w-[85px] flex-shrink-0 overflow-hidden rounded-2xl border border-background-700 bg-black">
        {!src || imgError ? (
          <span className="flex h-full w-full items-center justify-center text-lime-500"><Dumbbell size={40} /></span>
        ) : (
          <img src={src} alt="" loading="lazy" onError={() => setImgError(true)} className="h-full w-full object-cover" />
        )}
        {isView && (
          <span className="absolute right-1 top-1 z-50">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFavBurst((n) => n + 1); onToggleFavorite(item.exerciseId) }}
              aria-label={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
              aria-pressed={isFavorite}
              className="relative flex rounded-full bg-zinc-950/70 p-1 active:opacity-70"
            >
              {favBurst > 0 && <span key={favBurst} aria-hidden className="absolute inset-0 animate-bb-burst rounded-full border-2 border-lime-400" />}
              <Star size={24} className={isFavorite ? 'fill-white text-white' : 'text-white'} strokeWidth={isFavorite ? 2 : 1.5} />
            </button>
          </span>
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col items-start justify-center pe-4">
        <span className={`typo-h4 w-full truncate ${selected ? 'text-lime-400' : 'text-heading'}`}>{item.name_he}</span>
        <span className="mt-1 flex w-full min-w-0 items-center">
          <Target size={14} className={`flex-shrink-0 ${selected ? 'text-lime-400' : 'text-background-400'}`} aria-hidden />
          <span className="typo-label me-1 ms-1 truncate text-zinc-400">{item.targetMuscles_he.join(', ')}</span>
        </span>
        <span className="mt-3 flex flex-wrap gap-1">
          {item.equipments_he.slice(0, 2).map((eq, i) => (
            <span key={i} className={`rounded-2xl border px-2 py-1 ${selected ? 'border-lime-500/50 bg-lime-500/10' : 'border-zinc-700 bg-zinc-800'}`}>
              <span className={`typo-caption ${selected ? 'text-lime-300' : 'text-zinc-400'}`}>{eq}</span>
            </span>
          ))}
        </span>
      </span>

      <span className="flex items-center justify-center ps-1">
        {isView ? (
          <ChevronLeft size={20} className="text-zinc-600" aria-hidden />
        ) : (
          <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${selected ? 'border-lime-400 bg-lime-400' : 'border-zinc-600'}`}>
            {selected && <Check size={16} strokeWidth={3} className="text-black" />}
          </span>
        )}
      </span>
    </div>
  )
})

// ---------- filters ----------

const chipRow = 'flex gap-2 overflow-x-auto px-4'

/** Filters.tsx — "הכל" + one chip per area (shown only while no area is chosen) */
function BodyPartFilters({ parts, onSelect }: { parts: string[]; onSelect: (p: string) => void }) {
  return (
    <div className="py-4">
      <div className={chipRow}>
        <button type="button" onClick={() => onSelect('all')} aria-pressed className="flex-shrink-0 rounded-full border border-white bg-white px-5 py-2 active:opacity-70">
          <span className="typo-btn-cta text-black">הכל</span>
        </button>
        {parts.map((p) => (
          <button key={p} type="button" onClick={() => onSelect(p)} aria-pressed={false} className="flex-shrink-0 rounded-full border border-background-100 bg-background-1000 px-5 py-2 active:opacity-70">
            <span className="typo-body-primary whitespace-nowrap text-heading">{PARTS_HE[p] ?? p}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const softChip = (on: boolean) => `flex-shrink-0 rounded-full border px-4 py-1.5 active:opacity-70 ${on ? 'border-lime-500 bg-lime-500/20' : 'border-zinc-700 bg-transparent'}`
const softText = (on: boolean) => `typo-label whitespace-nowrap ${on ? 'text-lime-400' : 'text-zinc-400'}`

/** SubBodyPartFilters.tsx — breadcrumb back to the areas + sub-area chips */
function SubFilters({ items, selected, onSelect, onBack, breadcrumb }: { items: string[]; selected: string; onSelect: (k: string) => void; onBack?: () => void; breadcrumb?: string }) {
  return (
    <div className="pb-3">
      <div className={`${chipRow} items-center`}>
        {onBack && (<>
        <button type="button" onClick={onBack} aria-label="חזרה לאזורי גוף" className="flex min-h-11 flex-shrink-0 items-center justify-center px-2 active:opacity-70">
          <ChevronLeft size={16} className="text-lime-500" aria-hidden />
          <span className="typo-label whitespace-nowrap text-lime-400">{breadcrumb}</span>
        </button>
        <span aria-hidden className="h-5 w-px flex-shrink-0 bg-zinc-700" />
        </>)}
        {['all', ...items].map((k) => (
          <button key={k} type="button" onClick={() => onSelect(k)} aria-pressed={selected === k} className={softChip(selected === k)}>
            <span className={softText(selected === k)}>{k === 'all' ? 'הכל' : k}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const LOCATIONS: { value: Location; label: string; icon: LucideIcon }[] = [
  { value: 'all', label: 'הכל', icon: LayoutGrid },
  { value: 'home', label: 'בית', icon: Home },
  { value: 'gym', label: 'חדר כושר', icon: Dumbbell },
]

/** LocationFilter.tsx */
function LocationFilter({ selected, onSelect }: { selected: Location; onSelect: (v: Location) => void }) {
  return (
    <div className="pb-3">
      <div className={chipRow}>
        {LOCATIONS.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" onClick={() => onSelect(value)} aria-pressed={selected === value} aria-label={`סנן לפי ${label}`} className={`flex items-center gap-1.5 ${softChip(selected === value)}`}>
            <Icon size={14} className={selected === value ? 'text-lime-400' : 'text-zinc-400'} aria-hidden />
            <span className={softText(selected === value)}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------- EmptyState ----------

function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center px-8 pt-20">
      <div className="relative mb-8 flex h-40 w-40 items-center justify-center">
        <span className="absolute h-40 w-40 rounded-full bg-lime-500/5" />
        <span className="absolute h-32 w-32 rounded-full bg-lime-500/[0.08]" />
        <span className="relative rounded-full border border-white/[0.08] bg-background-800 p-8 text-lime-500"><Icon size={64} /></span>
      </div>
      <h3 className="typo-h2 mb-3 text-center text-heading">{title}</h3>
      <p className="typo-body mb-10 text-start text-background-300">{description}</p>
    </div>
  )
}

// ---------- selected exercises sheet (ModalBottom 50% + ListExercises mode 'edit') ----------

function SelectedSheet({ ids, onToggle, onClose }: { ids: string[]; onToggle: (id: string) => void; onClose: () => void }) {
  const { data: exercises = [], isLoading } = useExercisesByIds(ids)
  const [detail, setDetail] = useState<Exercise | null>(null)
  const ordered = useMemo(() => {
    const byId = new Map(exercises.map((e) => [e.exerciseId, e]))
    return ids.map((id) => byId.get(id)).filter((e): e is Exercise => !!e)
  }, [exercises, ids])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <button type="button" aria-label="סגור" onClick={onClose} className="fixed inset-0 z-[115] cursor-default bg-black/40" />
      <div role="dialog" aria-modal="true" aria-label="תרגילים נבחרים" className="fixed inset-x-0 bottom-0 z-[116] flex h-[50dvh] animate-[trayIn_0.28s_ease] flex-col rounded-t-[20px] bg-background-900">
        <div className="rounded-t-[20px] bg-background-900 py-3">
          <div className="flex justify-center"><span className="h-1 w-10 rounded-full bg-lime-400" /></div>
          <div className="mt-2.5 flex items-center justify-between px-4">
            <span className="w-11" />
            <h3 className="typo-h4 flex-1 text-center text-lime-400">תרגילים נבחרים</h3>
            <CloseButton onPress={onClose} label="סגור" />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
          {isLoading && ordered.length === 0 ? (
            <div className="flex h-28 flex-col items-center"><Loading /><span className="text-lime-500">טוען תרגילים...</span></div>
          ) : ordered.length === 0 ? (
            <div className="flex flex-col items-center py-10">
              <Dumbbell size={40} className="text-background-50" />
              <span className="mt-2 text-zinc-500">טרם נבחרו תרגילים</span>
            </div>
          ) : (
            ordered.map((ex) => (
              <div key={ex.exerciseId} className="mb-3 flex animate-[pageEnter_0.3s_ease_both] items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3">
                <button type="button" onClick={() => onToggle(ex.exerciseId)} aria-label={`הסר ${ex.name_he || ex.name}`} className="me-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger transition-transform active:scale-90">
                  <X size={20} />
                </button>
                <button type="button" onClick={() => setDetail(ex)} aria-label={`${ex.name_he || ex.name} - הצג פרטי תרגיל`} className="flex min-w-0 flex-1 items-center gap-3 text-start transition-transform active:scale-[0.98]">
                  <span className="flex-shrink-0 overflow-hidden rounded-xl bg-white/5">
                    {ex.imageUrls[0] ? <img src={ex.imageUrls[0]} alt="" className="h-14 w-14 object-cover" /> : <span className="flex h-14 w-14 items-center justify-center text-lime-500"><Dumbbell size={28} /></span>}
                  </span>
                  <span className="me-4 flex min-w-0 flex-1 flex-col items-start">
                    <span className="typo-body-primary w-full truncate text-heading">{ex.name_he || ex.name}</span>
                    <span className="mt-1 flex items-center">
                      <span className="typo-caption me-1 text-zinc-400">{ex.targetMuscles_he[0] || ex.targetMuscles[0]}</span>
                      <BicepsFlexed size={12} className="text-zinc-400" aria-hidden />
                    </span>
                  </span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <ExerciseDetailModal
        exercise={detail ? { ...detail, secondaryMuscles: [], secondaryMuscles_he: [], equipments: [], instructions: [], gifUrl: detail.imageUrls[0] } : null}
        isSelected
        onClose={() => setDetail(null)}
        onAdd={() => setDetail(null)}
        zIndexOverride={120}
      />
    </>
  )
}
