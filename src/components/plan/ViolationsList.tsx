import { useState, useMemo } from 'react'
import type { Plan, Unit } from '@/types'
import { evaluateViolations } from '@/ga/violations'

interface ViolationsListProps {
  plan: Plan
  unit: Unit
}

export function ViolationsList({ plan, unit }: ViolationsListProps) {
  const violations = useMemo(() => evaluateViolations(plan, unit), [plan, unit])
  const [open, setOpen] = useState(false)

  if (violations.length === 0) {
    return <div className="violations-banner violations-ok">✓ Plan spełnia wszystkie reguły</div>
  }

  const hard = violations.filter((v) => v.severity === 'hard').length

  return (
    <div className={`violations-banner ${hard > 0 ? 'violations-error' : 'violations-warn'}`}>
      <button className="violations-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▾' : '▸'} ⚠ Naruszenia reguł ({violations.length}{hard > 0 ? `, w tym ${hard} krytycznych` : ''})
      </button>
      {open && (
        <ul className="violations-list">
          {violations.map((v, i) => (
            <li key={i} className={v.severity === 'hard' ? 'violation-hard' : 'violation-soft'}>{v.message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
