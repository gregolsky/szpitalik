import { useRef, useState } from 'react'
import { MonthPicker } from './MonthPicker'
import type { Plan, Unit } from '@/types'

type Aspect = 'A' | 'B'
type CellDisplay = 'abbrev' | 'emoji'

interface ToolbarProps {
  plan: Plan
  unit: Unit
  aspect: Aspect
  cellDisplay: CellDisplay
  prefsEditMode: boolean
  gaRunning: boolean
  onAspectChange: (a: Aspect) => void
  onCellDisplayChange: (d: CellDisplay) => void
  onPrefsEditModeChange: (v: boolean) => void
  onGenerate: () => void
  onRegenerate: () => void
  onExportJson: () => void
  onExportEncryptedLink: () => void
  onImport: (file: File) => void
  onPrint: () => void
  onMonthChange: (year: number, month: number) => void
}

export function Toolbar({
  plan,
  unit: _unit,
  aspect,
  cellDisplay,
  prefsEditMode,
  gaRunning,
  onAspectChange,
  onCellDisplayChange,
  onPrefsEditModeChange,
  onGenerate,
  onRegenerate,
  onExportJson,
  onExportEncryptedLink,
  onImport,
  onPrint,
  onMonthChange,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [exportOpen, setExportOpen] = useState(false)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onImport(file)
    e.target.value = ''
  }

  return (
    <div className="toolbar no-print" role="toolbar" aria-label="Pasek narzędzi planu">
      <MonthPicker year={plan.year} month={plan.month} onChange={onMonthChange} />

      <div className="toolbar-sep" />

      <div className="btn-group" role="group" aria-label="Aspekt">
        <button
          className={`btn ${aspect === 'A' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onAspectChange('A')}
        >
          Przypisania
        </button>
        <button
          className={`btn ${aspect === 'B' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onAspectChange('B')}
        >
          Piony
        </button>
      </div>

      {aspect === 'A' && (
        <div className="btn-group" role="group" aria-label="Wyświetlanie komórek">
          <button
            className={`btn ${cellDisplay === 'abbrev' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onCellDisplayChange('abbrev')}
          >
            Skrót
          </button>
          <button
            className={`btn ${cellDisplay === 'emoji' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onCellDisplayChange('emoji')}
          >
            Emoji
          </button>
        </div>
      )}

      <button
        className={`btn ${prefsEditMode ? 'btn-warning' : 'btn-secondary'}`}
        onClick={() => onPrefsEditModeChange(!prefsEditMode)}
      >
        {prefsEditMode ? '✏️ Tryb preferencji ON' : '✏️ Preferencje'}
      </button>

      <div className="toolbar-sep" />

      <button className="btn btn-success" onClick={onGenerate} disabled={gaRunning}>
        {gaRunning ? '⏳ Generowanie…' : 'Generuj'}
      </button>
      <button className="btn btn-secondary" onClick={onRegenerate} disabled={gaRunning || plan.assignments.length === 0}>
        Regeneruj
      </button>

      <div className="toolbar-sep" />

      <div className="dropdown" style={{ position: 'relative' }}>
        <button className="btn btn-secondary" onClick={() => setExportOpen((v) => !v)}>
          Eksport ▾
        </button>
        {exportOpen && (
          <div className="dropdown-menu" onMouseLeave={() => setExportOpen(false)}>
            <button className="dropdown-item" onClick={() => { onExportJson(); setExportOpen(false) }}>
              JSON
            </button>
            <button className="dropdown-item" onClick={() => { onExportEncryptedLink(); setExportOpen(false) }}>
              Zaszyfrowany link
            </button>
          </div>
        )}
      </div>

      <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
        Import
      </button>
      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />

      <button className="btn btn-secondary" onClick={onPrint}>
        Drukuj
      </button>
    </div>
  )
}
