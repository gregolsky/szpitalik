import { useState, useRef } from 'react'
import type { Plan, Unit } from '@/types'
import { DOCTOR_TYPE_EMOJI } from '@/types'
import { sortDoctorsByTypeAndName } from '@/utils/sort'
import { daysInMonth, isWeekend } from '@/utils/date'
import { CellPicker } from './CellPicker'

interface AspectBProps {
  plan: Plan
  unit: Unit
  onCellPick: (date: string, wardId: string, doctorId: string | null) => void
}

export function AspectB({ plan, unit, onCellPick }: AspectBProps) {
  const days = daysInMonth(plan.year, plan.month)
  const dayNums = Array.from({ length: days }, (_, i) => i + 1)
  const doctors = sortDoctorsByTypeAndName(unit.doctors)

  const [picker, setPicker] = useState<{ wardId: string; date: string; anchor: DOMRect; hasAssignment: boolean } | null>(null)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function getDoctorName(doctorId: string | null): string {
    if (!doctorId) return ''
    const doc = unit.doctors.find((d) => d.id === doctorId)
    if (!doc) return '?'
    return `${DOCTOR_TYPE_EMOJI[doc.type]} ${doc.lastName} ${doc.firstName[0]}.`
  }

  function handleCellClick(e: React.MouseEvent, wardId: string, date: string, hasAssignment: boolean) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current)
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null
      setPicker({ wardId, date, anchor: rect, hasAssignment })
    }, 220)
  }

  function handleCellDoubleClick(wardId: string, date: string) {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
    }
    onCellPick(date, wardId, null)
  }

  const doctorOptions = doctors.map((d) => ({
    id: d.id,
    label: `${DOCTOR_TYPE_EMOJI[d.type]} ${d.lastName} ${d.firstName[0]}.`,
  }))

  return (
    <div className="grid-wrapper">
      <table className="schedule-grid" aria-label="Piony">
        <thead>
          <tr>
            <th className="header-cell sticky-col col-label">Pion</th>
            {dayNums.map((d) => (
              <th key={d} className={['day-header', isWeekend(plan.year, plan.month, d) ? 'weekend' : ''].filter(Boolean).join(' ')}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {unit.wards.map((ward) => (
            <tr key={ward.id}>
              <td className="ward-cell sticky-col">
                {ward.emoji ? `${ward.emoji} ` : ''}{ward.name}
              </td>
              {dayNums.map((d) => {
                const date = `${plan.year}-${String(plan.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                const assignment = plan.assignments.find((a) => a.date === date && a.wardId === ward.id)
                return (
                  <td
                    key={d}
                    className={['schedule-cell', isWeekend(plan.year, plan.month, d) ? 'weekend' : '', picker?.wardId === ward.id && picker?.date === date ? 'cell-selected' : ''].filter(Boolean).join(' ')}
                    aria-label={`${ward.name} ${d}`}
                    onClick={(e) => handleCellClick(e, ward.id, date, !!assignment?.doctorId)}
                    onDoubleClick={() => handleCellDoubleClick(ward.id, date)}
                  >
                    {assignment?.doctorId ? (
                      <span className={assignment.pinned ? 'cell-pinned' : ''}>
                        {assignment.pinned && <span className="pin-indicator" aria-label="Przypięty">📌</span>}
                        <span className="doctor-name">{getDoctorName(assignment.doctorId)}</span>
                      </span>
                    ) : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {picker && (
        <CellPicker
          options={doctorOptions}
          anchorRect={picker.anchor}
          onPick={(doctorId) => { onCellPick(picker.date, picker.wardId, doctorId); setPicker(null) }}
          onUnpin={picker.hasAssignment ? () => { onCellPick(picker.date, picker.wardId, null); setPicker(null) } : undefined}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
