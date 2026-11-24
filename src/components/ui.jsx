import { useEffect } from 'react'
import { CheckSquare2, X } from 'lucide-react'

export function IconButton({ label, onClick, children, className = '' }) {
  return <button className={`icon-button ${className}`} type="button" aria-label={label} title={label} onClick={onClick}>{children}</button>
}

export function Modal({ title, description, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal" style={wide ? { width: 'min(650px, 100%)' } : undefined} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <header className="modal-head">
          <div><h2 id="dialog-title">{title}</h2>{description && <p>{description}</p>}</div>
          <IconButton label="Close dialog" onClick={onClose}><X size={16} /></IconButton>
        </header>
        {children}
      </section>
    </div>
  )
}

export function EmptyState({ icon: Icon = CheckSquare2, title, copy, action, onAction }) {
  return <div className="empty-state"><div className="empty-mark"><Icon size={19} /></div><strong>{title}</strong><p>{copy}</p>{action && <button className="button small" type="button" onClick={onAction}>+ {action}</button>}</div>
}

export function SectionHeading({ eyebrow, title, copy, action, onAction }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action && <button type="button" className="button" onClick={onAction}>+ {action}</button>}</div>
}

export function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const value = payload[0].value || 0
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  const formatted = hours && minutes ? `${hours}h ${minutes}m` : hours ? `${hours}h` : `${minutes}m`
  return <div className="chart-tooltip"><strong>{label}</strong><div style={{ marginTop: 4 }}>{formatted} studied</div></div>
}
