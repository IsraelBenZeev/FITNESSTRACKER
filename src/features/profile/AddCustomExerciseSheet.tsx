/**
 * Add / edit a personal exercise — BodyBuddy-Client/src/Features/exercises/AddCustomExerciseModal.tsx.
 * Picked images are resized in the browser (max 1600px, JPEG 0.8) and uploaded through the server on save.
 */
import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Lock, Plus, X } from 'lucide-react'
import { Sheet } from '../../ui/Sheet'
import { ActionButton } from '../workouts/ui/primitives'
import { triggerFeedback } from '../../store/uiStore'
import { BODY_PART_ORDER, BODY_PARTS_HE, EQUIPMENT_OPTIONS, MAX_IMAGES, TEMPLATES, matchTemplate, musclesFor, type Template } from './customExerciseConstants'
import { uploadCustomExerciseImages, useSaveCustomExercise, type CustomExercise } from './useProfileData'

const MAX_WIDTH = 1600
const QUALITY = 0.8

/** An image is either already uploaded (url) or picked now (file + preview) */
type Img = { url: string; file?: File }

async function resizeImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file)
    if (bitmap.width <= MAX_WIDTH && file.type === 'image/jpeg') return file
    const scale = Math.min(1, MAX_WIDTH / bitmap.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', QUALITY))
    return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}

const chip = (on: boolean, solid: boolean) =>
  `min-h-[40px] flex-shrink-0 rounded-full border px-4 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500 ${
    on ? (solid ? 'typo-btn-cta border-lime-500 bg-lime-500 text-black' : 'typo-label border-lime-500 bg-lime-500/20 text-lime-400') : solid ? 'typo-body border-zinc-700 bg-transparent text-heading' : 'typo-label border-zinc-700 bg-transparent text-zinc-400'
  }`

const fieldBox = 'rounded-2xl border border-zinc-800 bg-zinc-900 px-4 focus-within:border-lime-500/60'
const inputCls = 'typo-input w-full bg-transparent py-3 text-heading placeholder:text-zinc-600 focus:outline-none'

export function AddCustomExerciseSheet({ open, onClose, exerciseToEdit }: { open: boolean; onClose: () => void; exerciseToEdit: CustomExercise | null }) {
  const isEdit = !!exerciseToEdit
  const save = useSaveCustomExercise()
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState('')
  const [bodyPart, setBodyPart] = useState<string | null>(null)
  const [targetMuscle, setTargetMuscle] = useState<string | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [equipment, setEquipment] = useState<string | null>(null)
  const [homeFriendly, setHomeFriendly] = useState(false)
  const [steps, setSteps] = useState<string[]>([''])
  const [images, setImages] = useState<Img[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const stepRefs = useRef<(HTMLInputElement | null)[]>([])
  const focusStep = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    const e = exerciseToEdit
    setName(e?.name ?? '')
    setBodyPart(e?.body_part ?? null)
    setTargetMuscle(e && musclesFor(e.body_part).some((s) => s.key === e.target_muscle) ? e.target_muscle : null)
    setTemplate(e ? matchTemplate(e.input_fields) : null)
    setEquipment(e?.equipment ?? null)
    setHomeFriendly(e?.home_friendly ?? false)
    setSteps(e && e.instructions.length ? e.instructions : [''])
    setImages((e?.image_urls ?? []).map((url) => ({ url })))
  }, [open, exerciseToEdit])

  // Free the previews of picked files when the sheet goes away
  const previews = useRef<string[]>([])
  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), [])

  useEffect(() => {
    const i = focusStep.current
    if (i == null) return
    focusStep.current = null
    stepRefs.current[i]?.focus()
  }, [steps.length])

  const subs = musclesFor(bodyPart)
  const canSubmit = name.trim().length > 0 && !!bodyPart && !!template
  const busy = save.isPending || uploading

  const pickImages = async (files: FileList | null) => {
    if (!files) return
    const room = MAX_IMAGES - images.length
    const picked = await Promise.all([...files].filter((f) => f.type.startsWith('image/')).slice(0, room).map(resizeImage))
    const added = picked.map((file) => ({ url: URL.createObjectURL(file), file }))
    previews.current.push(...added.map((a) => a.url))
    setImages((prev) => [...prev, ...added])
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async () => {
    if (!canSubmit || !bodyPart || !template) return
    let urls = images.map((i) => i.url)
    const fresh = images.filter((i) => i.file)
    if (fresh.length) {
      setUploading(true)
      try {
        const uploaded = await uploadCustomExerciseImages(fresh.map((i) => i.file!))
        const map = new Map(fresh.map((i, k) => [i.url, uploaded[k]!]))
        urls = images.map((i) => map.get(i.url) ?? i.url)
      } catch {
        triggerFeedback('שגיאה בהעלאת התמונות, נסה שוב', 'failed')
        setUploading(false)
        return
      }
      setUploading(false)
    }
    const payload = {
      name: name.trim(),
      body_part: bodyPart,
      target_muscle: targetMuscle,
      equipment,
      home_friendly: homeFriendly,
      instructions: steps.map((s) => s.trim()).filter(Boolean),
      image_urls: urls,
      input_fields: TEMPLATES[template].input_fields,
    }
    save.mutate(
      { id: exerciseToEdit?.id, payload, removedImageUrls: (exerciseToEdit?.image_urls ?? []).filter((u) => !urls.includes(u)) },
      { onSuccess: onClose },
    )
  }

  return (
    <Sheet open={open} title={isEdit ? 'עריכת תרגיל' : 'הוספת תרגיל ידנית'} onClose={onClose} level={2} tall>
      <div className="flex flex-col gap-6 pb-14 pt-2">
        {!isEdit && (
          <div className="flex items-start gap-3 rounded-3xl border border-lime-500/35 bg-lime-500/[0.12] p-4">
            <span aria-hidden className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-lime-500/[0.18] text-lime-300"><Lock size={18} /></span>
            <div className="flex-1">
              <p className="typo-body-primary text-lime-300">תרגיל אישי</p>
              <p className="typo-label mt-1 text-background-400">
                התרגיל יוצג רק לך ולא יהיה גלוי למשתמשים אחרים. תוכל להשתמש בו כמו בכל תרגיל באפליקציה – להוסיף למועדפים, לשלב אותו בתוכניות האימון שלך ולצפות בהתקדמות.
              </p>
            </div>
          </div>
        )}

        <label className="block">
          <span className="typo-label mb-2 block text-background-400">שם התרגיל</span>
          <span className={`block ${fieldBox}`}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: לחיצת חזה בקייבל" className={inputCls} />
          </span>
        </label>

        <div>
          <p className="typo-label mb-2 text-background-400">תמונות <span className="text-background-600">(רשות, עד {MAX_IMAGES})</span></p>
          <div className="flex gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <div key={img.url} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl">
                <img src={img.url} alt={`תמונה ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, k) => k !== i))}
                  aria-label={`מחק תמונה ${i + 1}`}
                  className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                aria-label="הוסף תמונה לתרגיל"
                className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900 text-background-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500"
              >
                <Camera size={22} />
                <span className="typo-caption mt-1">הוסף</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void pickImages(e.target.files)} />
          </div>
        </div>

        <ChipRow label="חלק גוף">
          {BODY_PART_ORDER.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={bodyPart === p}
              onClick={() => {
                // A sub-area belongs to the previous body part
                if (p !== bodyPart) setTargetMuscle(null)
                setBodyPart(p)
              }}
              className={chip(bodyPart === p, true)}
            >
              {BODY_PARTS_HE[p]}
            </button>
          ))}
        </ChipRow>

        {subs.length > 0 && (
          <ChipRow label={<>תת-אזור <span className="text-background-600">(רשות)</span></>}>
            {subs.map((s) => (
              <button key={s.key} type="button" aria-pressed={targetMuscle === s.key} onClick={() => setTargetMuscle(targetMuscle === s.key ? null : s.key)} className={chip(targetMuscle === s.key, false)}>
                {s.fullLabel}
              </button>
            ))}
          </ChipRow>
        )}

        <ChipRow label="סוג מדידה">
          {(Object.keys(TEMPLATES) as Template[]).map((t) => (
            <button key={t} type="button" aria-pressed={template === t} onClick={() => setTemplate(t)} className={chip(template === t, true)}>
              {TEMPLATES[t].label}
            </button>
          ))}
        </ChipRow>

        <ChipRow label={<>ציוד <span className="text-background-600">(רשות)</span></>}>
          {EQUIPMENT_OPTIONS.map((o) => (
            <button key={o.value} type="button" aria-pressed={equipment === o.value} onClick={() => setEquipment(equipment === o.value ? null : o.value)} className={chip(equipment === o.value, false)}>
              {o.label}
            </button>
          ))}
        </ChipRow>

        <button
          type="button"
          role="checkbox"
          aria-checked={homeFriendly}
          onClick={() => setHomeFriendly((v) => !v)}
          className={`flex min-h-[48px] items-center justify-between rounded-2xl border px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-500 ${homeFriendly ? 'border-lime-500/50 bg-lime-500/15' : 'border-zinc-800 bg-zinc-900'}`}
        >
          <span className={`typo-body-primary ${homeFriendly ? 'text-lime-300' : 'text-heading'}`}>מתאים לאימון ביתי</span>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${homeFriendly ? 'border-lime-500 bg-lime-500 text-black' : 'border-zinc-600'}`}>
            {homeFriendly && <Check size={14} strokeWidth={3} />}
          </span>
        </button>

        <div>
          <p className="typo-label mb-2 text-background-400">הוראות ביצוע <span className="text-background-600">(רשות)</span></p>
          <ol className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-2">
                <span aria-hidden className="typo-caption-bold flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-lime-500">{i + 1}</span>
                <span className={`flex-1 ${fieldBox}`}>
                  <input
                    ref={(n) => { stepRefs.current[i] = n }}
                    value={step}
                    onChange={(e) => setSteps((prev) => prev.map((s, k) => (k === i ? e.target.value : s)))}
                    placeholder={`שלב ${i + 1}...`}
                    aria-label={`שלב ${i + 1} בהוראות הביצוע`}
                    className={inputCls}
                  />
                </span>
                {steps.length > 1 && (
                  <button type="button" onClick={() => setSteps((prev) => prev.filter((_, k) => k !== i))} aria-label={`מחק שלב ${i + 1}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger">
                    <X size={16} />
                  </button>
                )}
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => setSteps((prev) => { focusStep.current = prev.length; return [...prev, ''] })}
            className="typo-caption-bold mt-3 flex min-h-[36px] items-center gap-1 rounded-full border border-lime-500/30 bg-lime-500/10 px-3 py-1.5 text-lime-400"
          >
            <Plus size={14} />
            הוסף שלב
          </button>
        </div>

        <ActionButton
          onPress={() => void submit()}
          label={uploading ? 'מעלה תמונות...' : isEdit ? 'שמור שינויים' : 'שמור תרגיל'}
          icon={Check}
          variant="primary"
          size="md"
          fullWidth
          loading={busy}
          disabled={!canSubmit}
        />
      </div>
    </Sheet>
  )
}

function ChipRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div role="group">
      <p className="typo-label mb-2 text-background-400">{label}</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">{children}</div>
    </div>
  )
}
