import { useEffect, useRef, useState, type ReactNode } from 'react'

interface HelpIconProps {
  label: string
  children: ReactNode
}

export function HelpIcon({ label, children }: HelpIconProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent) {
        if (e.key === 'Escape') setOpen(false)
      } else if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [open])

  return (
    <div className="help-icon-wrap" ref={ref}>
      <button
        type="button"
        className="help-icon"
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        ⓘ
      </button>
      {open && (
        <div className="help-popover" role="tooltip">
          {children}
        </div>
      )}
    </div>
  )
}
