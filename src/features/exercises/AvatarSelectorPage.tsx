/**
 * BodyBuddy-Client/src/Features/avatar/AvatarSelectorScreen.tsx (+ FloatingSelectionBar.tsx) —
 * the app's home tab: pick body areas on the avatar, flip it front/back, then see exercises.
 * Same layout, classes, texts and sizing; the reanimated flip becomes a CSS 3D flip.
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PersonStanding, XCircle } from 'lucide-react'
import { useProfile } from '../profile/useProfileData'
import { AVATAR_ASPECT_RATIO, BodyAvatar } from './avatar/BodyAvatar'
import { IconSwitchBody } from '../../shared/icons/BodyBuddyIcons'
import { partsBodyHebrew, type AvatarSide, type BodyPart, type Gender } from './avatar/types'

const lightTick = () => navigator.vibrate?.(10)

function useWindowSize() {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return size
}

export const exercisesListPath = (parts: BodyPart[]) => `/exercises/list?parts=${encodeURIComponent(JSON.stringify(parts))}`

export function AvatarSelectorPage() {
  const [side, setSide] = useState<AvatarSide>('front')
  const [selectedParts, setSelectedParts] = useState<BodyPart[]>([])
  const { data: profile, isLoading } = useProfile()
  const navigate = useNavigate()
  const { width, height } = useWindowSize()

  // Avatar SVG aspect 1726/871, drawn at 90% — cap its width so it fits the container (same math as the app)
  const containerHeight = Math.min(height * 0.6, height - 260)
  const svgWidth = Math.min(width * 0.82, containerHeight / (AVATAR_ASPECT_RATIO * 0.9))
  const gender: Gender = profile?.gender === 'female' ? 'female' : 'male'

  const togglePart = useCallback((part: BodyPart) => {
    lightTick()
    setSelectedParts((prev) => (prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]))
  }, [])
  const isSelected = useCallback((part: BodyPart) => selectedParts.includes(part), [selectedParts])

  const renderAvatar = (s: AvatarSide) => (
    <div className="flex flex-1 items-center justify-center">
      <BodyAvatar gender={gender} side={s} width={svgWidth} isSelected={isSelected} onTogglePart={side === s ? togglePart : undefined} />
    </div>
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[linear-gradient(to_bottom,theme(colors.background.900),theme(colors.background.950),theme(colors.background.800),theme(colors.background.700))]">
      <div className="relative flex flex-1 flex-col">
        {/* Header */}
        <div className="z-10 flex h-[120px] flex-col items-start px-[30px] pt-[calc(env(safe-area-inset-top,0px)+12px)]">
          <span className="typo-caption-bold uppercase tracking-[2px] text-zinc-500">Target Area</span>
          <h1 className="typo-h1 text-heading">בחירת אזור</h1>
          <span aria-hidden className="mt-2 h-1.5 w-20 rounded-[10px] bg-lime-500" />
        </div>

        {/* Avatar area */}
        <div className="relative flex flex-1 flex-col items-center pt-10">
          {/* Glow */}
          <span aria-hidden className="absolute top-[9dvh] z-[1] h-[60vw] max-h-[60dvh] w-[60vw] max-w-[60dvh] rounded-full bg-lime-500 opacity-[0.08]" />

          <div className="z-[5] flex h-[min(60dvh,calc(100dvh-260px))] w-full items-center justify-center [perspective:1200px]">
            {!isLoading && (
              <div className={`relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${side === 'back' ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute inset-0 flex [backface-visibility:hidden]" aria-hidden={side !== 'front'}>{renderAvatar('front')}</div>
                <div className="absolute inset-0 flex [backface-visibility:hidden] [transform:rotateY(180deg)]" aria-hidden={side !== 'back'}>{renderAvatar('back')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Rotate button */}
        <div className="absolute left-[30px] top-[63%] z-20 -translate-y-[30px]">
          <button
            type="button"
            onClick={() => setSide((s) => (s === 'front' ? 'back' : 'front'))}
            aria-label="סובב מודל"
            className="flex flex-col items-center transition-transform active:scale-95 active:opacity-70"
          >
            <span className="rounded-full border border-lime-500/50 bg-lime-500/[0.18] p-3.5">
              <IconSwitchBody size={26} className="fill-lime-300" />
            </span>
            <span className="typo-caption-bold mt-1.5 text-lime-300">סובב מודל</span>
          </button>
        </div>

        {/* Current side */}
        <div className="absolute right-[30px] top-[67%] z-20 -translate-y-[30px] rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5">
          <span className="typo-caption-bold text-zinc-400">{side === 'front' ? 'מבט קדמי' : 'מבט אחורי'}</span>
        </div>
      </div>

      {/* Cardio — only while nothing is selected, so it doesn't clash with the selection bar */}
      {selectedParts.length === 0 && (
        <div className="absolute right-6 top-20 z-40 flex flex-col items-center">
          <button
            type="button"
            onClick={() => navigate(exercisesListPath(['cardio']))}
            aria-label="עבור לתרגילי אירובי"
            title="פותח רשימת תרגילי אירובי כמו הליכון ואופניים"
            className="flex flex-col items-center transition-transform active:scale-95 active:opacity-70"
          >
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-lime-500/50 bg-background-700">
              <PersonStanding size={24} className="text-lime-300" />
            </span>
            <span className="typo-caption-bold mt-1.5 text-lime-300">תרגילי אירובי</span>
          </button>
        </div>
      )}

      {selectedParts.length > 0 && (
        <FloatingSelectionBar
          selectedParts={selectedParts}
          onDeselectPart={togglePart}
          onClearAll={() => setSelectedParts([])}
          onNavigate={() => navigate(exercisesListPath(selectedParts))}
        />
      )}
    </div>
  )
}

interface BarProps {
  selectedParts: BodyPart[]
  onDeselectPart: (part: BodyPart) => void
  onClearAll: () => void
  onNavigate: () => void
}

/** avatar/FloatingSelectionBar.tsx — 74px tab bar + 12px gap above the bottom */
function FloatingSelectionBar({ selectedParts, onDeselectPart, onClearAll, onNavigate }: BarProps) {
  return (
    <div className="fixed bottom-[calc(86px+env(safe-area-inset-bottom,0px))] left-4 right-4 z-50 animate-bb-fade-in-down">
      <div className="flex flex-col gap-2.5 rounded-[22px] border-[1.5px] border-lime-500/35 bg-black/[0.98] p-3.5 shadow-[0_0_22px] shadow-lime-500/20">
        <div className="flex items-center justify-between">
          <span className="typo-caption-bold tracking-wide text-zinc-500">{selectedParts.length} אזורים נבחרו</span>
          <button type="button" onClick={onClearAll} aria-label="נקה את כל הבחירות" className="transition-transform active:scale-95">
            <span className="typo-caption-bold text-danger">נקה הכל</span>
          </button>
        </div>

        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {selectedParts.map((part) => (
            <span key={part} className="flex flex-shrink-0 items-center gap-[5px] rounded-[20px] border border-lime-500/30 bg-lime-500/10 px-3 py-[5px]">
              <span className="typo-caption-bold text-lime-200">{partsBodyHebrew[part]}</span>
              <button
                type="button"
                onClick={() => onDeselectPart(part)}
                aria-label={`הסר ${partsBodyHebrew[part]}`}
                className="-m-3.5 p-3.5 transition-transform active:scale-90"
              >
                <XCircle size={14} className="text-lime-500/45" />
              </button>
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={onNavigate}
          aria-label="צפה בתרגילים לאזורים הנבחרים"
          className="flex h-14 w-full items-center justify-center rounded-full border border-lime-500/50 bg-lime-500/20 transition-transform active:scale-[0.98]"
        >
          <span className="typo-btn-cta text-lime-300">צפה בתרגילים</span>
        </button>
      </div>
    </div>
  )
}
