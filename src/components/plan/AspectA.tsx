import type { Plan, Unit, Assignment } from '@/types'
import { DOCTOR_TYPE_EMOJI } from '@/types'
import { sortDoctorsByLastName } from '@/utils/sort'
import { daysInMonth } from '@/utils/date'

type PrefState = 'none' | 'prefer' | 'exclude'
type CellDisplay = 'abbrev' | 'emoji'

interface AspectAProps {
  plan: Plan
  unit: Unit
  prefsEditMode: boolean
  cellDisplay: CellDisplay
  onPrefsChange: (plan: Plan) => void
  onTogglePin: (date: string, wardId: string) => void
}

function getPrefState(plan: Plan, doctorId: string, date: string): PrefState {
  if (plan.exclusions.some((e) => e.doctorId === doctorId && e.date === date)) return 'exclude'
  if (plan.preferences.some((e) => e.doctorId === doctorId && e.date === date)) return 'prefer'
  return 'none'
}

function nextPrefState(state: PrefState): PrefState {
  if (state === 'none') return 'prefer'
  if (state === 'prefer') return 'exclude'
  return 'none'
}

export function AspectA({ plan, unit, prefsEditMode, cellDisplay, onPrefsChange, onTogglePin }: AspectAProps) {
  const days = daysInMonth(plan.year, plan.month)
  const dayNums = Array.from({ length: days }, (_, i) => i + 1)
  const doctors = sortDoctorsByLastName(unit.doctors)

  const assignmentMap = new Map<string, Assignment>()
  for (const a of plan.assignments) {
    assignmentMap.set(`${a.date}:${a.wardId}`, a)
  }

  const assignedByDoctorDate = new Map<string, Assignment>()
  for (const a of plan.assignments) {
    if (a.doctorId) assignedByDoctorDate.set(`${a.doctorId}:${a.date}`, a)
  }

  function handleCellClick(doctorId: string, date: string) {
    if (!prefsEditMode) return
    const current = getPrefState(plan, doctorId, date)
    const next = nextPrefState(current)
    let prefs = plan.preferences.filter((e) => !(e.doctorId === doctorId && e.date === date))
    let excls = plan.exclusions.filter((e) => !(e.doctorId === doctorId && e.date === date))
    if (next === 'prefer') prefs = [...prefs, { doctorId, date }]
    if (next === 'exclude') excls = [...excls, { doctorId, date }]
    onPrefsChange({ ...plan, preferences: prefs, exclusions: excls })
  }

  function handleRightClick(e: React.MouseEvent, date: string, wardId: string) {
    e.preventDefault()
    onTogglePin(date, wardId)
  }

  function getCellContent(doctorId: string, date: string): React.ReactNode {
    if (prefsEditMode) {
      const state = getPrefState(plan, doctorId, date)
      if (state === 'prefer') return <span className="pref-check" aria-label="Preferowany">✓</span>
      if (state === 'exclude') return <span className="pref-cross" aria-label="Wykluczony">✗</span>
      return null
    }
    const a = assignedByDoctorDate.get(`${doctorId}:${date}`)
    if (!a) return null
    const ward = unit.wards.find((w) => w.id === a.wardId)
    if (!ward) return null
    const display = cellDisplay === 'emoji' && ward.emoji ? ward.emoji : ward.abbrev
    return (
      <span className={a.pinned ? 'cell-pinned' : ''} onContextMenu={(e) => handleRightClick(e, date, a.wardId)}>
        {a.pinned && <span className="pin-indicator" aria-label="Przypięty">📌</span>}
        {display}
      </span>
    )
  }

  return (
    <div className="grid-wrapper">
      <table className="schedule-grid" aria-label="Przypisania">
        <thead>
          <tr>
            <th className="header-cell sticky-col">Lekarz</th>
            {dayNums.map((d) => (
              <th key={d} className="day-header">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doctors.map((doc) => (
            <tr key={doc.id}>
              <td className="doctor-cell sticky-col">
                {DOCTOR_TYPE_EMOJI[doc.type]} {doc.lastName} {doc.firstName[0]}.
              </td>
              {dayNums.map((d) => {
                const date = `${plan.year}-${String(plan.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const prefState = prefsEditMode ? getPrefState(plan, doc.id, date) : 'none'
                const assigned = !prefsEditMode && assignedByDoctorDate.has(`${doc.id}:${date}`)
                return (
                  <td
                    key={d}
                    className={[
                      'schedule-cell',
                      prefsEditMode ? 'cell-edit-mode' : '',
                      prefState === 'prefer' ? 'cell-prefer' : '',
                      prefState === 'exclude' ? 'cell-exclude' : '',
                      assigned ? 'cell-assigned' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleCellClick(doc.id, date)}
                    aria-label={`${doc.lastName} ${d} ${plan.month}`}
                  >
                    {getCellContent(doc.id, date)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
