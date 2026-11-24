/**
 * "My exercises" — BodyBuddy-Client/src/Features/auth/MyCustomExercisesSection.tsx:
 * a card with up to 3 round thumbnails, and a sheet with search, body-part chips, groups,
 * an action menu (view / edit / delete) and the deleted ones with restore / delete forever.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronUp, Dumbbell, Eye, MoreHorizontal, Pencil, Plus, Search, Trash2, Undo2, XCircle } from 'lucide-react'
import { Sheet } from '../../ui/Sheet'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { ActionButton, Loading } from '../workouts/ui/primitives'
import { AddCustomExerciseSheet } from './AddCustomExerciseSheet'
import { BODY_PARTS_HE, BODY_PART_ORDER, equipmentLabel, formatDMY, subLabel } from './customExerciseConstants'
import { useCustomExercises, useDeletedCustomExercises, usePurgeCustomExercise, useSetCustomExerciseActive, type CustomExercise } from './useProfileData'

const TRIGGER_AVATARS = 3
const SEARCH_MIN = 4
const BUBBLE_MS = 1800

const metaOf = (e: CustomExercise) => {
  const parts = [equipmentLabel(e.equipment), e.home_friendly ? 'מתאים לבית' : null].filter(Boolean)
  return parts.length ? parts.join(' · ') : `נוצר ב-${formatDMY(e.created_at)}`
}

function Thumb({ url, size, ring }: { url?: string; size: 'sm' | 'md' | 'lg' | 'avatar'; ring?: 'lime' | 'card' }) {
  const box = { sm: 'h-11 w-11 rounded-[14px]', md: 'h-14 w-14 rounded-2xl', lg: 'h-16 w-16 rounded-2xl', avatar: 'h-[52px] w-[52px] rounded-full' }[size]
  const border = ring === 'lime' ? 'border-[3px] border-lime-500' : ring === 'card' ? 'border-[3px] border-background-800' : ''
  return (
    <span aria-hidden className={`flex flex-shrink-0 items-center justify-center overflow-hidden bg-background-700 text-background-400 ${box} ${border}`}>
      {url ? <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Dumbbell size={size === 'sm' ? 18 : 22} />}
    </span>
  )
}

// ---------- trigger card ----------

export function MyCustomExercisesTrigger({ onOpen }: { onOpen: () => void }) {
  const { data = [] } = useCustomExercises()
  const shown = data.slice(0, TRIGGER_AVATARS)
  const extra = data.length - shown.length
  const [bubble, setBubble] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const showName = (id: string) => {
    if (timer.current) clearTimeout(timer.current)
    setBubble(id)
    timer.current = setTimeout(() => setBubble(null), BUBBLE_MS)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={data.length ? `התרגילים שלי, ${data.length} תרגילים` : 'התרגילים שלי, עדיין אין תרגילים'}
        className="absolute inset-0 rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
      />
      <div className="pointer-events-none flex flex-col gap-3 rounded-3xl border border-white/5 bg-background-800 p-4">
        <div className="flex items-center gap-2">
          <h3 className="typo-h4 flex-1 text-heading">התרגילים שלי</h3>
          {data.length > 0 && <span className="typo-caption text-background-300">{data.length}</span>}
          <ChevronLeft size={16} className="text-background-400" aria-hidden />
        </div>
        {data.length > 0 ? (
          <div className="flex items-center">
            {shown.map((e, i) => (
              <button
                key={e.id}
                type="button"
                onClick={() => showName(e.id)}
                aria-label={e.name}
                className={`pointer-events-auto relative rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500 ${i > 0 ? '-ms-3.5' : ''} ${bubble === e.id ? 'z-10' : ''}`}
              >
                <Thumb url={e.image_urls[0]} size="avatar" ring={bubble === e.id ? 'lime' : 'card'} />
                {bubble === e.id && (
                  <span role="status" className="absolute bottom-[60px] start-0 flex w-[220px] flex-col items-start">
                    <span className="typo-label max-w-[220px] truncate rounded-2xl border border-lime-500/45 bg-background-900 px-3 py-1.5 text-heading">{e.name}</span>
                    <span aria-hidden className="ms-5 h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-lime-500/45" />
                  </span>
                )}
              </button>
            ))}
            {extra > 0 && (
              <span aria-hidden className="typo-caption-bold -ms-3.5 flex h-[52px] w-[52px] items-center justify-center rounded-full border-[3px] border-background-800 bg-background-600 text-heading">+{extra}</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-dashed border-lime-500/50 bg-lime-500/[0.08] text-lime-300"><Plus size={22} /></span>
            <p className="typo-label flex-1 text-background-300">חסר לך תרגיל? הוסף תרגיל משלך עם תמונות והוראות</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- sheet ----------

export function MyCustomExercisesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: activeData, isLoading } = useCustomExercises()
  const { data: deleted = [] } = useDeletedCustomExercises()
  const setActive = useSetCustomExerciseActive()
  const purge = usePurgeCustomExercise()
  const exercises = useMemo(() => activeData ?? [], [activeData])

  const [query, setQuery] = useState('')
  const [part, setPart] = useState<string | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [menu, setMenu] = useState<CustomExercise | null>(null)
  const [view, setView] = useState<CustomExercise | null>(null)
  const [edit, setEdit] = useState<{ open: boolean; exercise: CustomExercise | null }>({ open: false, exercise: null })
  const [toDelete, setToDelete] = useState<CustomExercise | null>(null)
  const [deleteEverywhere, setDeleteEverywhere] = useState(false)
  const [toPurge, setToPurge] = useState<CustomExercise | null>(null)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setPart(null)
    }
  }, [open])

  const partCounts = useMemo(() => {
    const counts = new Map<string, number>()
    exercises.forEach((e) => counts.set(e.body_part, (counts.get(e.body_part) ?? 0) + 1))
    return BODY_PART_ORDER.filter((p) => counts.has(p)).map((p) => ({ part: p, count: counts.get(p)! }))
  }, [exercises])
  // The chosen part may vanish (its last exercise deleted) — back to "all"
  const activePart = part && partCounts.some((p) => p.part === part) ? part : null

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = exercises.filter((e) => (!activePart || e.body_part === activePart) && (!q || e.name.toLowerCase().includes(q)))
    return BODY_PART_ORDER.map((bp) => ({ bp, items: list.filter((e) => e.body_part === bp) })).filter((g) => g.items.length)
  }, [exercises, query, activePart])

  const busy = setActive.isPending || purge.isPending

  return (
    <>
      <Sheet
        open={open}
        title="התרגילים שלי"
        onClose={onClose}
        headerAction={<ActionButton onPress={() => setEdit({ open: true, exercise: null })} label="הוסף תרגיל חדש" icon={Plus} variant="primary" iconOnly />}
      >
        <div className="flex flex-col gap-4 pb-6 pt-1">
          {!isLoading && (
            <p className="typo-caption text-background-300">
              {exercises.length ? `${exercises.length} תרגילים · ${partCounts.length === 1 ? 'אזור אחד בגוף' : `${partCounts.length} אזורים בגוף`}` : 'עדיין אין תרגילים'}
            </p>
          )}

          {exercises.length >= SEARCH_MIN && (
            <label className="flex min-h-[44px] items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 focus-within:border-lime-500/50">
              <Search size={18} className="text-background-400" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש תרגיל"
                aria-label="חיפוש בתרגילים שלי"
                className="typo-input min-w-0 flex-1 bg-transparent py-2.5 text-heading placeholder:text-background-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} aria-label="נקה חיפוש" className="-me-3 flex h-11 w-11 items-center justify-center text-background-400">
                  <XCircle size={18} />
                </button>
              )}
            </label>
          )}

          {partCounts.length > 1 && (
            <div role="tablist" className="-mx-4 flex gap-2 overflow-x-auto px-4">
              <FilterChip label={`הכל · ${exercises.length}`} selected={activePart === null} onPress={() => setPart(null)} />
              {partCounts.map(({ part: p, count }) => (
                <FilterChip key={p} label={`${BODY_PARTS_HE[p] ?? p} · ${count}`} selected={activePart === p} onPress={() => setPart(p)} />
              ))}
            </div>
          )}

          {isLoading ? (
            <Loading size={72} />
          ) : exercises.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/5 bg-background-900 p-5">
              <Dumbbell size={28} className="text-lime-300" aria-hidden />
              <p className="typo-label text-center text-background-300">עדיין לא הוספת תרגילים משלך. אפשר להוסיף תרגיל חסר גם ישירות ממסך בחירת התרגילים.</p>
            </div>
          ) : groups.length === 0 ? (
            <p className="typo-label py-4 text-center text-background-300">לא נמצאו תרגילים מתאימים</p>
          ) : (
            groups.map((g) => (
              <section key={g.bp} className="flex flex-col gap-2" aria-labelledby={`ce-${g.bp}`}>
                <h3 id={`ce-${g.bp}`} className="typo-caption-bold uppercase tracking-widest text-background-300">{`${BODY_PARTS_HE[g.bp] ?? g.bp} · ${g.items.length}`}</h3>
                {g.items.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-3xl border border-white/5 bg-white/[0.03] p-2.5">
                    <button type="button" onClick={() => setView(e)} aria-label={`צפה בתרגיל ${e.name}, ${metaOf(e)}`} className="flex min-w-0 flex-1 items-center gap-3 text-start transition-opacity active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500">
                      <Thumb url={e.image_urls[0]} size="md" />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="typo-body-primary truncate text-heading">{e.name}</span>
                        <span className="typo-caption truncate text-background-300">{metaOf(e)}</span>
                      </span>
                    </button>
                    <button type="button" onClick={() => setMenu(e)} aria-label={`פעולות על ${e.name}`} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/5 text-background-200 active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                ))}
              </section>
            ))
          )}

          {deleted.length > 0 && (
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setShowDeleted((v) => !v)}
                aria-expanded={showDeleted}
                className="flex min-h-[52px] items-center gap-3 rounded-3xl border border-white/10 px-4 text-start active:opacity-80"
              >
                <Undo2 size={18} className="text-background-300" aria-hidden />
                <span className="typo-label flex-1 text-background-200">{`תרגילים שמחקתי · ${deleted.length}`}</span>
                {showDeleted ? <ChevronUp size={18} className="text-background-300" aria-hidden /> : <ChevronDown size={18} className="text-background-300" aria-hidden />}
              </button>
              {showDeleted && (
                <>
                  <p className="typo-caption text-background-300">התרגילים האלה מוסתרים אך עדיין מופיעים בתוכניות אימון ובהיסטוריה. מחיקה לצמיתות תסיר אותם מכל מקום.</p>
                  {deleted.map((e) => (
                    <div key={e.id} className="flex flex-col gap-3 rounded-3xl border border-white/5 bg-background-950 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb url={e.image_urls[0]} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="typo-body-primary truncate text-heading">{e.name}</p>
                          <p className="typo-caption mt-0.5 text-background-300">{BODY_PARTS_HE[e.body_part] ?? e.body_part}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" disabled={busy} onClick={() => setActive.mutate({ id: e.id, active: true })} aria-label={`בטל מחיקה של ${e.name}`} className="typo-label flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-lime-500/40 bg-lime-500/15 px-3 text-lime-300 disabled:opacity-50">
                          <Undo2 size={16} aria-hidden />
                          בטל מחיקה
                        </button>
                        <button type="button" disabled={busy} onClick={() => setToPurge(e)} aria-label={`מחק לצמיתות את ${e.name}`} className="typo-label flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full border border-danger/30 bg-danger/10 px-3 text-danger disabled:opacity-50">
                          <Trash2 size={16} aria-hidden />
                          מחק לצמיתות
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </Sheet>

      <ActionMenu
        exercise={menu}
        onClose={() => setMenu(null)}
        onView={(e) => setView(e)}
        onEdit={(e) => setEdit({ open: true, exercise: e })}
        onDelete={(e) => { setDeleteEverywhere(false); setToDelete(e) }}
      />

      <ExerciseViewSheet exercise={view} onClose={() => setView(null)} />

      <AddCustomExerciseSheet open={edit.open} exerciseToEdit={edit.exercise} onClose={() => setEdit({ open: false, exercise: null })} />

      <ConfirmDialog
        visible={toDelete !== null}
        title="מחיקת תרגיל"
        message={`האם למחוק את "${toDelete?.name ?? ''}" מהרשימה שלך?`}
        infoNote={deleteEverywhere ? 'התרגיל, התמונות וכל הנתונים שלו יימחקו לצמיתות, ולא ניתן לשחזר' : 'ברירת מחדל: התרגיל יוסתר מהרשימה אך יישאר בתוכניות אימון ובהיסטוריה שכבר משתמשות בו'}
        checkboxLabel="מחק גם מתוכניות האימון ומההיסטוריה"
        checkboxChecked={deleteEverywhere}
        onCheckboxChange={setDeleteEverywhere}
        isLoading={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return
          const id = toDelete.id
          setToDelete(null)
          if (deleteEverywhere) purge.mutate(id)
          else setActive.mutate({ id, active: false })
        }}
      />

      <ConfirmDialog
        visible={toPurge !== null}
        title="מחיקה לצמיתות"
        message={`האם למחוק את "${toPurge?.name ?? ''}" לצמיתות?`}
        infoNote="התרגיל יוסר מתוכניות האימון, הסטים שלו יימחקו מההיסטוריה והתמונות יימחקו. לא ניתן לשחזר"
        isLoading={busy}
        onCancel={() => setToPurge(null)}
        onConfirm={() => {
          if (!toPurge) return
          const id = toPurge.id
          setToPurge(null)
          purge.mutate(id)
        }}
      />
    </>
  )
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onPress}
      className={`typo-label flex min-h-[44px] flex-shrink-0 items-center justify-center rounded-full border px-4 ${selected ? 'border-lime-500/50 bg-lime-500/20 text-lime-300' : 'border-white/10 text-background-200'}`}
    >
      {label}
    </button>
  )
}

/** ActionMenuSheet: exercise header + view / edit / delete */
function ActionMenu({ exercise, onClose, onView, onEdit, onDelete }: { exercise: CustomExercise | null; onClose: () => void; onView: (e: CustomExercise) => void; onEdit: (e: CustomExercise) => void; onDelete: (e: CustomExercise) => void }) {
  if (!exercise) return null
  const run = (fn: (e: CustomExercise) => void) => () => { onClose(); fn(exercise) }
  const items = [
    { key: 'view', label: 'צפייה בתרגיל', Icon: Eye, onPress: run(onView), danger: false },
    { key: 'edit', label: 'עריכה', Icon: Pencil, onPress: run(onEdit), danger: false },
    { key: 'delete', label: 'מחיקה', Icon: Trash2, onPress: run(onDelete), danger: true },
  ]
  return (
    <Sheet open title="פעולות" onClose={onClose} level={2}>
      <div className="flex flex-col gap-4 pb-6 pt-1">
        <div className="flex items-center gap-3">
          <Thumb url={exercise.image_urls[0]} size="lg" />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <p className="typo-h4 line-clamp-2 text-heading">{exercise.name}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="typo-caption rounded-full bg-lime-500/15 px-2.5 py-0.5 text-lime-300">{BODY_PARTS_HE[exercise.body_part] ?? exercise.body_part}</span>
              <span className="typo-caption rounded-full bg-white/5 px-2.5 py-0.5 text-background-200">{`נוצר ${formatDMY(exercise.created_at)}`}</span>
            </div>
          </div>
        </div>
        <ul className="flex flex-col gap-2">
          {items.map(({ key, label, Icon, onPress, danger }) => (
            <li key={key}>
              <button
                type="button"
                onClick={onPress}
                className={`typo-body-primary flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500 ${danger ? 'border-danger/25 bg-danger/[0.06] text-danger' : 'border-white/5 bg-white/[0.03] text-heading'}`}
              >
                <Icon size={18} aria-hidden className={danger ? 'text-danger' : 'text-lime-300'} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}

/** Read-only view of a personal exercise: images, tags and steps */
function ExerciseViewSheet({ exercise, onClose }: { exercise: CustomExercise | null; onClose: () => void }) {
  if (!exercise) return null
  const tags = [BODY_PARTS_HE[exercise.body_part] ?? exercise.body_part, subLabel(exercise.target_muscle), equipmentLabel(exercise.equipment), exercise.home_friendly ? 'מתאים לבית' : null].filter(Boolean) as string[]
  return (
    <Sheet open title={exercise.name} onClose={onClose} level={2} tall>
      <div className="flex flex-col gap-5 pb-8 pt-1">
        {exercise.image_urls.length > 0 ? (
          <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4">
            {exercise.image_urls.map((u, i) => (
              <img key={u} src={u} alt={`${exercise.name}, תמונה ${i + 1}`} className="aspect-square w-[85%] flex-shrink-0 snap-center rounded-3xl bg-background-800 object-cover" />
            ))}
          </div>
        ) : (
          <div className="flex aspect-[2/1] items-center justify-center rounded-3xl bg-background-800 text-background-400"><Dumbbell size={40} aria-hidden /></div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => <span key={t} className="typo-caption rounded-full bg-lime-500/15 px-2.5 py-1 text-lime-300">{t}</span>)}
        </div>
        {exercise.instructions.length > 0 && (
          <section aria-labelledby="ce-steps">
            <h3 id="ce-steps" className="typo-h4 mb-3 text-heading">הוראות ביצוע</h3>
            <ol className="flex flex-col gap-2.5">
              {exercise.instructions.map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span aria-hidden className="typo-caption-bold flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-lime-500/40 bg-lime-500/15 text-lime-300">{i + 1}</span>
                  <p className="typo-body pt-0.5 text-zinc-300">{s}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </Sheet>
  )
}
