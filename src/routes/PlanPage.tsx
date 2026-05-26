import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Plan, Unit, Assignment } from '@/types'
import { usePlans } from '@/state/PlansContext'
import { useUnits } from '@/state/UnitsContext'
import { useGA } from '@/hooks/useGA'
import { Toolbar } from '@/components/plan/Toolbar'
import { AspectA } from '@/components/plan/AspectA'
import { AspectB } from '@/components/plan/AspectB'
import { ProgressBar } from '@/components/plan/ProgressBar'
import { Modal } from '@/components/common/Modal'
import { exportSinglePlan } from '@/io/exportJson'
import { parseImportFile, readFileAsText } from '@/io/importJson'
import { encodeShareLink } from '@/crypto/share'
import { putPlan } from '@/storage/db'
import { generateSlots } from '@/utils/date'

type Aspect = 'A' | 'B'
type CellDisplay = 'abbrev' | 'emoji'

export function PlanPage() {
  const { planId } = useParams<{ planId: string }>()
  const { plans, savePlan } = usePlans()
  const { units } = useUnits()
  const { running, progress, run, cancel } = useGA()

  const [plan, setPlan] = useState<Plan | null>(null)
  const [unit, setUnit] = useState<Unit | null>(null)
  const [aspect, setAspect] = useState<Aspect>('A')
  const [cellDisplay, setCellDisplay] = useState<CellDisplay>('abbrev')
  const [prefsEditMode, setPrefsEditMode] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [sharePassword, setSharePassword] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [shareError, setShareError] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [printMode, setPrintMode] = useState(false)

  useEffect(() => {
    const p = plans.find((x) => x.id === planId)
    if (p) {
      setPlan(p)
      const u = units.find((x) => x.id === p.unitId)
      if (u) setUnit(u)
    }
  }, [planId, plans, units])

  if (!plan || !unit) {
    return <div className="page-loading">Ładowanie planu…</div>
  }

  async function persist(updated: Plan) {
    setPlan(updated)
    await savePlan(updated)
  }

  function getSlots() {
    return generateSlots(plan!.year, plan!.month, unit!.wards.map((w) => w.id))
  }

  async function handleGenerate() {
    if (!plan || !unit) return
    const emptyPlan = {
      ...plan,
      assignments: getSlots().map((s) => ({ ...s, doctorId: null, pinned: false })),
    }
    try {
      const result = await run(unit, emptyPlan)
      await persist({ ...plan, assignments: result })
    } catch {
      // cancelled or error — silently ignore
    }
  }

  async function handleRegenerate() {
    if (!plan || !unit) return
    try {
      const result = await run(unit, plan)
      const merged: Assignment[] = result.map((a) => {
        const orig = plan.assignments.find((o) => o.date === a.date && o.wardId === a.wardId)
        if (orig?.pinned) return orig
        return a
      })
      await persist({ ...plan, assignments: merged })
    } catch {
      // cancelled
    }
  }

  function handleTogglePin(date: string, wardId: string) {
    if (!plan) return
    const updated = plan.assignments.map((a) =>
      a.date === date && a.wardId === wardId ? { ...a, pinned: !a.pinned } : a,
    )
    void persist({ ...plan, assignments: updated })
  }

  async function handleShareExport() {
    if (!plan || !unit) return
    setShareError('')
    try {
      const token = await encodeShareLink(unit, plan, sharePassword)
      const url = `${window.location.origin}${window.location.pathname}#share=${token}`
      setShareLink(url)
    } catch (err) {
      setShareError(String(err))
    }
  }

  async function handleImport(file: File) {
    setImportError(null)
    try {
      const text = await readFileAsText(file)
      const payload = parseImportFile(text)
      if (payload.type === 'single_plan') {
        await putPlan(payload.plan)
        if (payload.plan.id === plan?.id) {
          setPlan(payload.plan)
        }
      }
    } catch (err) {
      setImportError(String(err))
    }
  }

  function handlePrint() {
    setPrintMode(true)
    setTimeout(() => {
      window.print()
      setPrintMode(false)
    }, 100)
  }

  async function handleMonthChange(year: number, month: number) {
    if (!plan) return
    await persist({ ...plan, year, month, assignments: [] })
  }

  return (
    <div className={`page plan-page ${printMode ? 'print-mode' : ''}`}>
      <Toolbar
        plan={plan}
        unit={unit}
        aspect={aspect}
        cellDisplay={cellDisplay}
        prefsEditMode={prefsEditMode}
        gaRunning={running}
        onAspectChange={setAspect}
        onCellDisplayChange={setCellDisplay}
        onPrefsEditModeChange={setPrefsEditMode}
        onGenerate={() => void handleGenerate()}
        onRegenerate={() => void handleRegenerate()}
        onExportJson={() => exportSinglePlan(unit, plan)}
        onExportEncryptedLink={() => setShareModalOpen(true)}
        onImport={(file) => void handleImport(file)}
        onPrint={handlePrint}
        onMonthChange={(y, m) => void handleMonthChange(y, m)}
      />

      {running && (
        <ProgressBar progress={progress} onCancel={cancel} />
      )}

      {importError && (
        <div className="alert alert-error">
          {importError}
          <button className="btn btn-sm" onClick={() => setImportError(null)}>✕</button>
        </div>
      )}

      <div className="print-header">
        <h2>{unit.name} — {plan.year}-{String(plan.month).padStart(2, '0')}{plan.label ? ` — ${plan.label}` : ''}</h2>
      </div>

      {aspect === 'A' ? (
        <AspectA
          plan={plan}
          unit={unit}
          prefsEditMode={prefsEditMode}
          cellDisplay={cellDisplay}
          onPrefsChange={(updated) => void persist(updated)}
          onTogglePin={handleTogglePin}
        />
      ) : (
        <AspectB plan={plan} unit={unit} />
      )}

      {shareModalOpen && (
        <Modal
          title="Eksport — zaszyfrowany link"
          onClose={() => { setShareModalOpen(false); setShareLink(''); setSharePassword(''); setShareError('') }}
          footer={
            !shareLink ? (
              <>
                <button className="btn btn-secondary" onClick={() => setShareModalOpen(false)}>Anuluj</button>
                <button className="btn btn-primary" onClick={() => void handleShareExport()}>Generuj link</button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setShareModalOpen(false)}>Zamknij</button>
            )
          }
        >
          {!shareLink ? (
            <>
              <div className="form-group">
                <label>Hasło do szyfrowania</label>
                <input
                  type="password"
                  className="form-input"
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                />
              </div>
              {shareError && <p className="error-msg">{shareError}</p>}
            </>
          ) : (
            <div className="form-group">
              <label>Link (skopiuj i wyślij odbiorcy):</label>
              <textarea
                className="form-input"
                rows={4}
                value={shareLink}
                readOnly
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <p className="hint">Odbiorca będzie potrzebował hasła: <strong>{sharePassword}</strong></p>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
