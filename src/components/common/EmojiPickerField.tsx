import { useState, useRef, useEffect, lazy, Suspense } from 'react'

const Picker = lazy(() => import('@emoji-mart/react'))

interface Props {
  value: string | null
  onChange: (emoji: string | null) => void
}

export function EmojiPickerField({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<object | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load emoji data only when picker is first opened
  useEffect(() => {
    if (!open || data) return
    void import('@emoji-mart/data').then((m) => setData(m.default as object))
  }, [open, data])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
      <button
        type="button"
        className="btn btn-secondary emoji-trigger"
        onClick={() => setOpen((o) => !o)}
      >
        {value
          ? <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{value}</span>
          : <span style={{ opacity: 0.6 }}>Wybierz emoji…</span>}
      </button>
      {value && (
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          title="Usuń emoji"
          onClick={() => onChange(null)}
        >
          ✕
        </button>
      )}
      {open && (
        <div style={{ position: 'absolute', zIndex: 1000, top: 'calc(100% + 4px)', left: 0 }}>
          <Suspense fallback={<div style={{ padding: '1rem' }}>Ładowanie…</div>}>
            {data && (
              <Picker
                data={data}
                onEmojiSelect={(e: { native: string }) => {
                  onChange(e.native)
                  setOpen(false)
                }}
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={2}
              />
            )}
          </Suspense>
        </div>
      )}
    </div>
  )
}
