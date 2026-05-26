import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Unit } from '@/types'
import { genId } from '@/utils/id'
import { useUnits } from '@/state/UnitsContext'
import { UnitTab } from '@/components/setup/UnitTab'
import { WardsTab } from '@/components/setup/WardsTab'
import { DoctorsTab } from '@/components/setup/DoctorsTab'
import { RulesTab } from '@/components/setup/RulesTab'

type TabKey = 'unit' | 'wards' | 'doctors' | 'rules'
const TABS: { key: TabKey; label: string }[] = [
  { key: 'unit', label: 'Jednostka' },
  { key: 'wards', label: 'Piony' },
  { key: 'doctors', label: 'Lekarze' },
  { key: 'rules', label: 'Reguły' },
]

const EMPTY_UNIT: Unit = { id: '', name: '', wards: [], doctors: [], rules: [], defaultMaxDuties: 6, allowConsecutiveDuties: false }

function validateTab(tab: TabKey, unit: Partial<Unit>): string | null {
  if (tab === 'unit' && !unit.name?.trim()) return 'Nazwa jednostki jest wymagana'
  if (tab === 'wards' && (!unit.wards || unit.wards.length === 0)) return 'Dodaj co najmniej jeden pion'
  if (tab === 'doctors' && (!unit.doctors || unit.doctors.length === 0)) return 'Dodaj co najmniej jednego lekarza'
  return null
}

export function SetupPage() {
  const { unitId } = useParams<{ unitId: string }>()
  const isNew = unitId === 'new'
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { units, createUnit, updateUnit } = useUnits()

  const [draft, setDraft] = useState<Unit>({ ...EMPTY_UNIT, id: genId() })
  const initialTab = (searchParams.get('tab') as TabKey | null) ?? 'unit'
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [tabError, setTabError] = useState<string | null>(null)
  const [globalErrors, setGlobalErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isNew && unitId) {
      const existing = units.find((u) => u.id === unitId)
      if (existing) setDraft(existing)
    }
  }, [isNew, unitId, units])

  function patch(changes: Partial<Unit>) {
    setDraft((d) => ({ ...d, ...changes }))
    setGlobalErrors({})
  }

  async function handleSave() {
    if (isNew) {
      await createUnit(draft)
    } else {
      await updateUnit(draft)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleNext() {
    const err = validateTab(activeTab, draft)
    if (err) { setTabError(err); return }
    setTabError(null)
    const idx = TABS.findIndex((t) => t.key === activeTab)
    if (idx < TABS.length - 1) {
      setActiveTab(TABS[idx + 1]!.key)
    } else {
      void handleSave().then(() => navigate('/'))
    }
  }

  function handleBack() {
    setTabError(null)
    const idx = TABS.findIndex((t) => t.key === activeTab)
    if (idx > 0) setActiveTab(TABS[idx - 1]!.key)
  }

  const tabIdx = TABS.findIndex((t) => t.key === activeTab)

  return (
    <div className="page setup-page">
      <div className="page-header">
        <h1>{isNew ? 'Nowa jednostka' : `Edycja: ${draft.name || '…'}`}</h1>
        {!isNew && (
          <button className="btn btn-secondary" onClick={() => navigate('/')}>← Powrót</button>
        )}
      </div>

      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${activeTab === t.key ? 'tab-active' : ''}`}
            onClick={() => { if (!isNew) setActiveTab(t.key) }}
            disabled={isNew && TABS.findIndex((x) => x.key === t.key) > tabIdx}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {activeTab === 'unit' && (
          <UnitTab unit={draft} onChange={patch} errors={globalErrors} />
        )}
        {activeTab === 'wards' && (
          <WardsTab wards={draft.wards} onChange={(wards) => patch({ wards })} />
        )}
        {activeTab === 'doctors' && (
          <DoctorsTab doctors={draft.doctors} onChange={(doctors) => patch({ doctors })} />
        )}
        {activeTab === 'rules' && (
          <RulesTab
            rules={draft.rules}
            defaultMaxDuties={draft.defaultMaxDuties}
            allowConsecutiveDuties={draft.allowConsecutiveDuties}
            onChange={(rules) => patch({ rules })}
            onSettingsChange={(s) => patch(s)}
          />
        )}
      </div>

      {tabError && <div className="alert alert-error">{tabError}</div>}
      {saved && <div className="alert alert-success">Zapisano!</div>}

      <div className="wizard-nav">
        {isNew ? (
          <>
            {tabIdx > 0 && <button className="btn btn-secondary" onClick={handleBack}>← Wstecz</button>}
            <button className="btn btn-primary" onClick={handleNext}>
              {tabIdx < TABS.length - 1 ? 'Dalej →' : 'Zapisz i zakończ'}
            </button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => void handleSave()}>Zapisz</button>
        )}
      </div>
    </div>
  )
}
