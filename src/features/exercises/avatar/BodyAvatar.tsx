/**
 * BodyBuddy-Client/src/Features/avatar/{male,female}/Avatar{Male,Female}{Front,Back}.tsx —
 * the same artwork (avatarArt.ts), the same 871×1726 viewBox, ×0.9 sizing and fills.
 */
import { memo } from 'react'
import { AVATARS } from './avatarArt'
import { partsBodyHebrew, type AvatarSide, type BodyPart, type Gender } from './types'

const FIGMA_WIDTH = 871
const FIGMA_HEIGHT = 1726
export const AVATAR_ASPECT_RATIO = FIGMA_HEIGHT / FIGMA_WIDTH

type FillRule = 'nonzero' | 'evenodd' | 'inherit'

interface Props {
  gender: Gender
  side: AvatarSide
  /** svgWidthOverride in the app — the drawn svg is 90% of it */
  width: number
  isSelected: (part: BodyPart) => boolean
  onTogglePart?: (part: BodyPart) => void
}

export const BodyAvatar = memo(function BodyAvatar({ gender, side, width, isSelected, onTogglePart }: Props) {
  const art = AVATARS[gender][side]
  const interactive = !!onTogglePart
  return (
    <svg
      width={width * 0.9}
      height={width * AVATAR_ASPECT_RATIO * 0.9}
      viewBox={`0 0 ${FIGMA_WIDTH} ${FIGMA_HEIGHT}`}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden={!interactive}
      className="block"
    >
      <g className="pointer-events-none">
        {art.general.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} fillRule={p.fillRule as FillRule} clipRule={p.clipRule as FillRule} />
        ))}
      </g>
      {art.parts.map(({ part, paths }) => {
        const bodyPart = part as BodyPart
        const selected = isSelected(bodyPart)
        return (
          <g
            key={part}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? `${partsBodyHebrew[bodyPart]} - ${selected ? 'נבחר' : 'לחץ לבחירה'}` : undefined}
            aria-pressed={interactive ? selected : undefined}
            onPointerDown={interactive ? () => onTogglePart(bodyPart) : undefined}
            onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTogglePart(bodyPart) } } : undefined}
            className={`${selected ? 'fill-lime-600' : 'fill-background-400'} ${interactive ? 'cursor-pointer outline-none [-webkit-tap-highlight-color:transparent] focus-visible:fill-lime-700' : 'pointer-events-none'}`}
          >
            {paths.map((p, i) => (
              <path key={i} d={p.d} fillRule={p.fillRule as FillRule} clipRule={p.clipRule as FillRule} />
            ))}
          </g>
        )
      })}
    </svg>
  )
})

const MINI_WIDTH = 50
const MINI_WIDTH_DUAL = 38
const BACK_ONLY_PARTS: BodyPart[] = ['back']

/** Features/exercises/MiniAvatar.tsx — the selected areas on a small avatar (both sides when needed) */
export function MiniAvatar({ selectedParts, gender, preferBack = false }: { selectedParts: BodyPart[]; gender: Gender; preferBack?: boolean }) {
  const isSelected = (p: BodyPart) => selectedParts.includes(p)
  const hasFront = !preferBack && selectedParts.some((p) => !BACK_ONLY_PARTS.includes(p))
  const hasBack = preferBack || selectedParts.some((p) => BACK_ONLY_PARTS.includes(p))
  if (hasFront && hasBack) {
    return (
      <div className="pointer-events-none flex gap-1" aria-hidden>
        <div className="overflow-hidden"><BodyAvatar gender={gender} side="front" width={MINI_WIDTH_DUAL} isSelected={isSelected} /></div>
        <div className="overflow-hidden"><BodyAvatar gender={gender} side="back" width={MINI_WIDTH_DUAL} isSelected={isSelected} /></div>
      </div>
    )
  }
  return (
    <div className="pointer-events-none overflow-hidden" aria-hidden>
      <BodyAvatar gender={gender} side={hasFront ? 'front' : 'back'} width={MINI_WIDTH} isSelected={isSelected} />
    </div>
  )
}
