import type { Plan, Unit } from '@/types'
import { daysInMonth } from '@/utils/date'

interface AspectBProps {
  plan: Plan
  unit: Unit
}

export function AspectB({ plan, unit }: AspectBProps) {
  const days = daysInMonth(plan.year, plan.month)
  const dayNums = Array.from({ length: days }, (_, i) => i + 1)

  function getDoctorName(doctorId: string | null): string {
    if (!doctorId) return ''
    const doc = unit.doctors.find((d) => d.id === doctorId)
    if (!doc) return '?'
    return `${doc.lastName} ${doc.firstName[0]}.`
  }

  return (
    <div className="grid-wrapper">
      <table className="schedule-grid" aria-label="Piony">
        <thead>
          <tr>
            <th className="header-cell sticky-col">Pion</th>
            {dayNums.map((d) => (
              <th key={d} className="day-header">{d}</th>
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
                  <td key={d} className="schedule-cell" aria-label={`${ward.name} ${d}`}>
                    {assignment?.doctorId ? (
                      <span className="doctor-name">{getDoctorName(assignment.doctorId)}</span>
                    ) : null}
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
