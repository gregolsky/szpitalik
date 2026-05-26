import type { Plan, Unit, Assignment } from '@/types'
import { DOCTOR_TYPE_EMOJI, getEffectiveMaxDuties } from '@/types'
import { sortDoctorsByTypeAndName } from '@/utils/sort'
import { daysInMonth, isWeekend } from '@/utils/date'

type CellDisplay = 'abbrev' | 'emoji'

interface AspectAProps {
  plan: Plan
  unit: Unit
  prefsEditMode: boolean
  cellDisplay: CellDisplay
  onPrefsChange: (plan: Plan) => void
  onTogglePin: (date: string, wardId: string) => void
}

function isExcluded(plan: Plan, doctorId: string, date: string): boolean {
  return plan.exclusions.some((e) => e.doctorId === doctorId && e.date === date)
}

export function AspectA({ plan, unit, prefsEditMode, cellDisplay, onPrefsChange, onTogglePin }: AspectAProps) {
  const days = daysInMonth(plan.year, plan.month)
  const dayNums = Array.from({ length: days }, (_, i) => i + 1)
  const doctors = sortDoctorsByTypeAndName(unit.doctors)

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
    const excls = isExcluded(plan, doctorId, date)
      ? plan.exclusions.filter((e) => !(e.doctorId === doctorId && e.date === date))
      : [...plan.exclusions, { doctorId, date }]
    onPrefsChange({ ...plan, exclusions: excls })
  }

  function handleRowBlock(doctorId: string) {
    const allDates = dayNums.map((d) => `${plan.year}-${String(plan.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    const allBlocked = allDates.every((date) => isExcluded(plan, doctorId, date))
    const excls = allBlocked
      ? plan.exclusions.filter((e) => e.doctorId !== doctorId)
      : [
          ...plan.exclusions.filter((e) => e.doctorId !== doctorId),
          ...allDates.map((date) => ({ doctorId, date })),
        ]
    onPrefsChange({ ...plan, exclusions: excls })
  }

  function handleRightClick(e: React.MouseEvent, date: string, wardId: string) {
    e.preventDefault()
    onTogglePin(date, wardId)
  }

  function getCellContent(doctorId: string, date: string): React.ReactNode {
    if (prefsEditMode) {
      return isExcluded(plan, doctorId, date)
        ? <span className="pref-cross" aria-label="Wykluczony">✗</span>
        : null
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
            <th className="header-cell sticky-col sticky-col-2">Max dni</th>
            {dayNums.map((d) => (
              <th key={d} className={['day-header', isWeekend(plan.year, plan.month, d) ? 'weekend' : ''].filter(Boolean).join(' ')}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doctors.map((doc) => (
            <tr key={doc.id}>
              <td className="doctor-cell sticky-col">
                <span className="doctor-name-text">{DOCTOR_TYPE_EMOJI[doc.type]} {doc.lastName} {doc.firstName[0]}.</span>
                {prefsEditMode && (() => {
                  const allDates = dayNums.map((d) => `${plan.year}-${String(plan.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
                  const allBlocked = allDates.every((date) => isExcluded(plan, doc.id, date))
                  return (
                    <button
                      className="row-block-btn"
                      title={allBlocked ? 'Odblokuj cały rząd' : 'Zablokuj cały rząd'}
                      aria-label={allBlocked ? 'Odblokuj cały rząd' : 'Zablokuj cały rząd'}
                      onClick={() => handleRowBlock(doc.id)}
                    >
                      {allBlocked ? '🔓' : '🔒'}
                    </button>
                  )
                })()}
              </td>
              <td className="max-duties-cell sticky-col sticky-col-2">
                {prefsEditMode ? (
                  <input
                    type="number"
                    min={0}
                    max={31}
                    className="max-duties-input"
                    value={plan.doctorMaxDuties[doc.id] ?? unit.defaultMaxDuties}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (!Number.isInteger(v) || v < 0 || v > 31) return
                      const overrides = { ...plan.doctorMaxDuties }
                      if (v === unit.defaultMaxDuties) {
                        delete overrides[doc.id]
                      } else {
                        overrides[doc.id] = v
                      }
                      onPrefsChange({ ...plan, doctorMaxDuties: overrides })
                    }}
                  />
                ) : (
                  getEffectiveMaxDuties(plan, unit, doc.id) === 0
                    ? <span title="Nie dyżuruje">🚫</span>
                    : getEffectiveMaxDuties(plan, unit, doc.id)
                )}
              </td>
              {dayNums.map((d) => {
                const date = `${plan.year}-${String(plan.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const excluded = prefsEditMode && isExcluded(plan, doc.id, date)
                const assigned = !prefsEditMode && assignedByDoctorDate.has(`${doc.id}:${date}`)
                return (
                  <td
                    key={d}
                    className={[
                      'schedule-cell',
                      isWeekend(plan.year, plan.month, d) ? 'weekend' : '',
                      prefsEditMode ? 'cell-edit-mode' : '',
                      excluded ? 'cell-exclude' : '',
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
