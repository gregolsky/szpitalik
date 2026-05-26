import { useState, useRef } from 'react'
import type { Plan, Unit, Assignment } from '@/types'
import { DOCTOR_TYPE_EMOJI, getEffectiveMaxDuties } from '@/types'
import { sortDoctorsByTypeAndName } from '@/utils/sort'
import { daysInMonth, isWeekend } from '@/utils/date'
import { CellPicker } from './CellPicker'

type CellDisplay = 'abbrev' | 'emoji'

interface AspectAProps {
  plan: Plan
  unit: Unit
  prefsEditMode: boolean
  cellDisplay: CellDisplay
  onPrefsChange: (plan: Plan) => void
  onCellPick: (date: string, doctorId: string, wardId: string | null) => void
}

function isExcluded(plan: Plan, doctorId: string, date: string): boolean {
  return plan.exclusions.some((e) => e.doctorId === doctorId && e.date === date)
}

export function AspectA({ plan, unit, prefsEditMode, cellDisplay, onPrefsChange, onCellPick }: AspectAProps) {
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

  const [picker, setPicker] = useState<{ doctorId: string; date: string; anchor: DOMRect } | null>(null)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCellClick(e: React.MouseEvent, doctorId: string, date: string) {
    if (prefsEditMode) {
      const excls = isExcluded(plan, doctorId, date)
        ? plan.exclusions.filter((ex) => !(ex.doctorId === doctorId && ex.date === date))
        : [...plan.exclusions, { doctorId, date }]
      onPrefsChange({ ...plan, exclusions: excls })
      return
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      setPicker({ doctorId, date, anchor: rect })
    }, 220)
  }

  function handleCellDoubleClick(doctorId: string, date: string) {
    if (prefsEditMode) return
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }
    onCellPick(date, doctorId, null)
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
      <span className={a.pinned ? 'cell-pinned' : ''}>
        {a.pinned && <span className="pin-indicator" aria-label="Przypięty">📌</span>}
        {display}
      </span>
    )
  }

  const wardOptions = unit.wards.map((w) => ({
    id: w.id,
    label: [w.emoji, w.name].filter(Boolean).join(' '),
  }))

  return (
    <div className="grid-wrapper">
      <table className="schedule-grid" aria-label="Przypisania">
        <thead>
          <tr>
            <th className="header-cell sticky-col col-label">Lekarz</th>
            <th className="header-cell col-maxduties">Max dni</th>
            {dayNums.map((d) => (
              <th key={d} className={['day-header', isWeekend(plan.year, plan.month, d) ? 'weekend' : ''].filter(Boolean).join(' ')}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doctors.map((doc) => (
            <tr key={doc.id}>
              <td className="doctor-cell sticky-col">
                <div className="doctor-cell-inner">
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
                </div>
              </td>
              <td className="max-duties-cell">
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
                      picker?.doctorId === doc.id && picker?.date === date ? 'cell-selected' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={(e) => handleCellClick(e, doc.id, date)}
                    onDoubleClick={() => handleCellDoubleClick(doc.id, date)}
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
      {picker && (
        <CellPicker
          options={wardOptions}
          anchorRect={picker.anchor}
          onPick={(wardId) => { onCellPick(picker.date, picker.doctorId, wardId); setPicker(null) }}
          onUnpin={assignedByDoctorDate.has(`${picker.doctorId}:${picker.date}`) ? () => { onCellPick(picker.date, picker.doctorId, null); setPicker(null) } : undefined}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
