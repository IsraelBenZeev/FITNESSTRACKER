import { Card } from './Card'

interface StatCardProps {
  label: string
  value: number | string
  unit?: string
  sublabel?: string
  danger?: boolean
}

export function StatCard({ label, value, unit, sublabel, danger = false }: StatCardProps) {
  return (
    <Card hover style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span
        style={{
          fontFamily: '"Rubik", sans-serif',
          fontSize: '11px',
          color: '#666',
          fontWeight: 500,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '28px',
            color: danger ? '#ff4757' : '#D7FF00',
            lineHeight: 1,
            letterSpacing: '0.02em',
          }}
        >
          {typeof value === 'number' ? Math.round(value) : value}
        </span>
        {unit && (
          <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#666' }}>
            {unit}
          </span>
        )}
      </div>
      {sublabel && (
        <span style={{ fontFamily: '"Rubik", sans-serif', fontSize: '11px', color: '#666' }}>
          {sublabel}
        </span>
      )}
    </Card>
  )
}
