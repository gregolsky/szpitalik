import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface CellPickerOption {
  id: string
  label: string
}

interface CellPickerProps {
  options: CellPickerOption[]
  onPick: (id: string) => void
  onUnpin?: () => void
  onClose: () => void
  anchorRect: DOMRect
}

export function CellPicker({ options, onPick, onUnpin, onClose, anchorRect }: CellPickerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const PICKER_WIDTH = 200
  const PICKER_MAX_HEIGHT = 320
  const left = Math.min(anchorRect.left, window.innerWidth - PICKER_WIDTH - 8)
  const spaceBelow = window.innerHeight - anchorRect.bottom - 8
  const top = spaceBelow >= 150
    ? anchorRect.bottom + 2
    : Math.max(8, anchorRect.top - PICKER_MAX_HEIGHT)

  return createPortal(
    <div
      ref={ref}
      className="cell-picker"
      style={{ top, left }}
    >
      <ul>
        {onUnpin && (
          <li className="unpin" onMouseDown={(e) => { e.preventDefault(); onUnpin() }}>
            Odepnij
          </li>
        )}
        {options.map((opt) => (
          <li key={opt.id} onMouseDown={(e) => { e.preventDefault(); onPick(opt.id) }}>
            {opt.label}
          </li>
        ))}
      </ul>
    </div>,
    document.body,
  )
}
