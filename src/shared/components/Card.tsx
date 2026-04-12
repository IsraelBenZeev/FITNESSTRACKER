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
        background: '#111111',
        borderTop: '2px solid #D7FF00',
        border: `1px solid ${hover && hovered ? '#D7FF00' : '#222222'}`,
        borderTopColor: '#D7FF00',
        borderRadius: '10px',
        transition: hover ? 'border-color 0.2s ease' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
