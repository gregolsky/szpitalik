import { useRef, useState } from 'react'
import { MonthPicker } from './MonthPicker'
import { HelpIcon } from '@/components/common/HelpIcon'
import type { Plan, Unit } from '@/types'

type Aspect = 'A' | 'B'

interface ToolbarProps {
  plan: Plan
  unit: Unit
  aspect: Aspect
  prefsEditMode: boolean
  gaRunning: boolean
  onAspectChange: (a: Aspect) => void
  onPrefsEditModeChange: (v: boolean) => void
  onGenerate: () => void
  onRegenerate: () => void
  onExportJson: () => void
  onExportEncryptedLink: () => void
  onImport: (file: File) => void
  onPrint: () => void
}

export function Toolbar({
  plan,
  aspect,
  prefsEditMode,
  gaRunning,
  onAspectChange,
  onPrefsEditModeChange,
  onGenerate,
  onRegenerate,
  onExportJson,
  onExportEncryptedLink,
  onImport,
  onPrint,
}: ToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const hasAssignments = plan.assignments.some((a) => a.doctorId)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onImport(file)
    e.target.value = ''
  }

  return (
    <div className="toolbar no-print" role="toolbar" aria-label="Pasek narzędzi planu">
      <MonthPicker year={plan.year} month={plan.month} />

      <div className="toolbar-sep" />

      {!prefsEditMode && (
        <button
          className="btn btn-success"
          onClick={hasAssignments ? onRegenerate : onGenerate}
          disabled={gaRunning}
        >
          {gaRunning ? '⏳ Generowanie…' : hasAssignments ? '🔄 Regeneruj' : '⚡ Generuj'}
        </button>
      )}
      <HelpIcon label="Pomoc — generowanie planu">
        <p>Uruchamia algorytm genetyczny w tle i wypełnia sloty zgodnie z regułami i preferencjami lekarzy.</p>
        <p>Regeneracja zachowuje komórki oznaczone jako przypięte (🔒).</p>
      </HelpIcon>

      <button
        className={`btn ${prefsEditMode ? 'btn-warning' : 'btn-secondary'}`}
        onClick={() => onPrefsEditModeChange(!prefsEditMode)}
      >
        {prefsEditMode ? '✏️ Preferencje lekarzy ON' : '✏️ Preferencje lekarzy'}
      </button>
      <HelpIcon label="Pomoc — preferencje lekarzy">
        <p>Włącz, aby klikając komórki w siatce zaznaczyć niedostępność lub priorytet dyżuru dla danego lekarza w konkretnym dniu.</p>
        <p>Algorytm genetyczny uwzględni te preferencje przy generowaniu planu.</p>
      </HelpIcon>

      <div className="toolbar-spacer" />

      <div className="btn-group" role="group" aria-label="Aspekt">
        <button
          className={`btn ${aspect === 'A' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onAspectChange('A')}
        >
          📋 Przypisania
        </button>
        <button
          className={`btn ${aspect === 'B' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onAspectChange('B')}
        >
          🏥 Piony
        </button>
      </div>
      <HelpIcon label="Pomoc — widoki planu">
        <p><strong>Przypisania</strong>: rzędy to lekarze, kolumny to dni. Widać ile dyżurów ma każdy lekarz.</p>
        <p><strong>Piony</strong>: rzędy to stanowiska dyżurowe (piony), kolumny to dni. Widać obsadę każdego pionu.</p>
      </HelpIcon>

      <div className="toolbar-sep" />

      <div className="dropdown" style={{ position: 'relative' }}>
        <button className="btn btn-secondary" onClick={() => setExportOpen((v) => !v)}>
          📤 Eksport ▾
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
      <HelpIcon label="Pomoc — eksport">
        <p><strong>JSON</strong>: pełny snapshot planu do archiwum lub przesłania.</p>
        <p><strong>Zaszyfrowany link</strong>: link chroniony hasłem — odbiorca musi je znać. Dane nie opuszczają przeglądarki.</p>
      </HelpIcon>

      <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
        📥 Import
      </button>
      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileChange} />
      <HelpIcon label="Pomoc — import">
        <p>Wczytuje plan z pliku JSON. Jeśli plan na ten miesiąc już istnieje, zostaniesz zapytany o nadpisanie lub zapisanie jako nowa wersja.</p>
      </HelpIcon>

      <button className="btn btn-secondary" onClick={onPrint}>
        🖨️ Drukuj
      </button>
      <HelpIcon label="Pomoc — drukowanie">
        <p>Drukuje aktualny widok (pasek narzędzi jest ukryty). Działa zarówno dla Przypisań, jak i Pionów.</p>
      </HelpIcon>
    </div>
  )
}
