export function Header() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #222',
        paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
        paddingBottom: '12px',
        paddingLeft: '16px',
        paddingRight: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: '24px',
          color: '#D7FF00',
          letterSpacing: '0.05em',
          lineHeight: 1,
        }}
      >
        FITNESS
      </span>
      <span
        style={{
          fontFamily: '"Rubik", sans-serif',
          fontSize: '13px',
          color: '#666',
          fontWeight: 400,
        }}
      >
        {new Date().toLocaleDateString('he-IL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </span>
    </header>
  )
}
