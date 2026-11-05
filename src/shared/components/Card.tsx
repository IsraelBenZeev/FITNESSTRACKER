import { type CSSProperties, type ReactNode, useState } from 'react'

interface CardProps {
  children: ReactNode
  style?: CSSProperties
  hover?: boolean
}

export function Card({ children, style, hover = false }: CardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={hover ? () => setHovered(true) : undefined}
      onMouseLeave={hover ? () => setHovered(false) : undefined}
      style={{
        background: '#252D3A',
        borderTop: '2px solid #96C828',
        border: `1px solid ${hover && hovered ? '#96C828' : 'rgba(255,255,255,0.08)'}`,
        borderTopColor: '#96C828',
        borderRadius: '10px',
        transition: hover ? 'border-color 0.2s ease' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
