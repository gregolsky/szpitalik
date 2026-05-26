import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUnits } from '@/state/UnitsContext'
import { usePlans } from '@/state/PlansContext'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Modal } from '@/components/common/Modal'
import { genId } from '@/utils/id'
import { exportFullSnapshot, exportSinglePlan } from '@/io/exportJson'
import { parseImportFile, readFileAsText } from '@/io/importJson'
import { putUnit, putPlan } from '@/storage/db'
import { decodeShareLink } from '@/crypto/share'
import type { Plan, Unit } from '@/types'

export function HomePage() {
  const { units, loading: unitsLoading, deleteUnit, reload: reloadUnits } = useUnits()
  const { plans, loading: plansLoading, savePlan, deletePlan, reload: reloadPlans } = usePlans()
  const navigate = useNavigate()

  const [deleteUnitId, setDeleteUnitId] = useState<string | null>(null)
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [conflictState, setConflictState] = useState<{
    plan: Plan
    existingId: string
    unit: Unit
  } | null>(null)
  const [conflictLabel, setConflictLabel] = useState('')
  const [shareToken, setShareToken] = useState('')
  const [sharePassword, setSharePassword] = useState('')
  const [shareError, setShareError] = useState('')
  const [showShareImport, setShowShareImport] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const now = new Date()

  function handleCreateUnit() {
    navigate('/setup/new')
  }

  async function handleDeleteUnit(id: string) {
    await deleteUnit(id)
    setDeleteUnitId(null)
    await reloadPlans()
  }

  async function handleDeletePlan(id: string) {
    await deletePlan(id)
    setDeletePlanId(null)
  }

  async function handleCreatePlan(unitId: string) {
    const plan: Plan = {
      id: genId(),
      unitId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      label: null,
      exclusions: [],
      assignments: [],
      doctorMaxDuties: {},
    }
    await savePlan(plan)
    navigate(`/plan/${plan.id}`)
  }

  async function handleImportFile(file: File) {
    setImportError(null)
    try {
      const text = await readFileAsText(file)
      const payload = parseImportFile(text)

      if (payload.type === 'full_snapshot') {
        await putUnit(payload.unit)
        for (const p of payload.plans) await putPlan(p)
        await reloadUnits()
        await reloadPlans()
      } else {
        const unitExists = units.find((u) => u.id === payload.unitRef.id || u.name === payload.unitRef.name)
        if (!unitExists) {
          setImportError(`Jednostka "${payload.unitRef.name}" nie istnieje lokalnie. Najpierw zaimportuj pełny snapshot.`)
          return
        }
        const effectiveUnitId = unitExists.id
        const imported = { ...payload.plan, unitId: effectiveUnitId }
        const existing = plans.find(
          (p) => p.unitId === effectiveUnitId && p.year === imported.year && p.month === imported.month,
        )
        if (existing) {
          setConflictState({ plan: imported, existingId: existing.id, unit: unitExists })
          return
        }
        await putPlan(imported)
        await reloadPlans()
      }
    } catch (err) {
      setImportError(String(err))
    }
  }

  async function handleConflictOverwrite() {
    if (!conflictState) return
    await putPlan({ ...conflictState.plan, id: conflictState.existingId })
    await reloadPlans()
    setConflictState(null)
  }

  async function handleConflictRename() {
    if (!conflictState || !conflictLabel.trim()) return
    await putPlan({ ...conflictState.plan, id: genId(), label: conflictLabel.trim() })
    await reloadPlans()
    setConflictState(null)
    setConflictLabel('')
  }

  async function handleShareImport() {
    setShareError('')
    try {
      const payload = await decodeShareLink(shareToken, sharePassword)
      await putUnit(payload.unit)
      await putPlan(payload.plan)
      await reloadUnits()
      await reloadPlans()
      setShowShareImport(false)
      setShareToken('')
      setSharePassword('')
    } catch {
      setShareError('Nieprawidłowe hasło lub uszkodzony link')
    }
  }

  const loading = unitsLoading || plansLoading

  if (loading) return <div className="page-loading">Ładowanie…</div>

  return (
    <div className="page home-page">
      <div className="page-header">
        <h1>Jednostki</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleCreateUnit}>+ Nowa jednostka</button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleImportFile(f)
              e.target.value = ''
            }}
          />
          <button className="btn btn-secondary" onClick={() => setShowShareImport(true)}>
            Otwórz link
          </button>
        </div>
      </div>

      {importError && (
        <div className="alert alert-error">
          {importError}
          <button className="btn btn-sm btn-secondary" onClick={() => setImportError(null)}>✕</button>
        </div>
      )}

      {units.length === 0 ? (
        <div className="empty-state">
          <p>Brak jednostek. Utwórz pierwszą jednostkę, aby zacząć.</p>
        </div>
      ) : (
        <div className="units-list">
          {units.map((unit) => {
            const unitPlans = plans.filter((p) => p.unitId === unit.id)
            return (
              <div key={unit.id} className="unit-card">
                <div className="unit-card-header">
                  <h2 className="unit-name">{unit.name}</h2>
                  <div className="unit-actions">
                    <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/setup/${unit.id}`)}>
                      Edytuj
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => void exportFullSnapshot(unit, unitPlans)}>
                      Eksport
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => setDeleteUnitId(unit.id)}>
                      Usuń
                    </button>
                  </div>
                </div>

                <div className="plans-list">
                  <button className="btn btn-sm btn-primary" onClick={() => void handleCreatePlan(unit.id)}>
                    + Nowy plan
                  </button>
                  {unitPlans.map((plan) => (
                    <div key={plan.id} className="plan-row">
                      <span className="plan-info">
                        {plan.year}-{String(plan.month).padStart(2, '0')}
                        {plan.label ? ` — ${plan.label}` : ''}
                      </span>
                      <div className="plan-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/plan/${plan.id}`)}>
                          Otwórz
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => exportSinglePlan(unit, plan)}>
                          Eksport
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => setDeletePlanId(plan.id)}>
                          Usuń
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deleteUnitId && (
        <ConfirmDialog
          title="Usuń jednostkę"
          message="Czy na pewno chcesz usunąć tę jednostkę? Zostaną usunięte też wszystkie jej plany."
          confirmLabel="Usuń"
          danger
          onConfirm={() => void handleDeleteUnit(deleteUnitId)}
          onCancel={() => setDeleteUnitId(null)}
        />
      )}

      {deletePlanId && (
        <ConfirmDialog
          title="Usuń plan"
          message="Czy na pewno chcesz usunąć ten plan?"
          confirmLabel="Usuń"
          danger
          onConfirm={() => void handleDeletePlan(deletePlanId)}
          onCancel={() => setDeletePlanId(null)}
        />
      )}

      {conflictState && (
        <Modal
          title="Konflikt planu"
          onClose={() => setConflictState(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setConflictState(null)}>Anuluj</button>
              <button className="btn btn-primary" onClick={() => void handleConflictOverwrite()}>Nadpisz</button>
              <button
                className="btn btn-primary"
                onClick={() => void handleConflictRename()}
                disabled={!conflictLabel.trim()}
              >
                Importuj jako nowy
              </button>
            </>
          }
        >
          <p>Plan na {conflictState.plan.year}-{String(conflictState.plan.month).padStart(2, '0')} już istnieje dla jednostki "{conflictState.unit.name}".</p>
          <div className="form-group">
            <label>Etykieta dla importowanego planu (jeśli chcesz zachować oba):</label>
            <input
              className="form-input"
              value={conflictLabel}
              onChange={(e) => setConflictLabel(e.target.value)}
              placeholder="np. Wersja 2"
            />
          </div>
        </Modal>
      )}

      {showShareImport && (
        <Modal
          title="Otwórz zaszyfrowany link"
          onClose={() => setShowShareImport(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowShareImport(false)}>Anuluj</button>
              <button className="btn btn-primary" onClick={() => void handleShareImport()}>Importuj</button>
            </>
          }
        >
          <div className="form-group">
            <label>Token (część po #share= w linku)</label>
            <input
              className="form-input"
              value={shareToken}
              onChange={(e) => setShareToken(e.target.value)}
              placeholder="Wklej token z linku"
            />
          </div>
          <div className="form-group">
            <label>Hasło</label>
            <input
              type="password"
              className="form-input"
              value={sharePassword}
              onChange={(e) => setSharePassword(e.target.value)}
            />
          </div>
          {shareError && <p className="error-msg">{shareError}</p>}
        </Modal>
      )}
    </div>
  )
}
