import type { Unit } from '@/types'

interface UnitTabProps {
  unit: Partial<Unit>
  onChange: (patch: Partial<Unit>) => void
  errors: Record<string, string>
}

export function UnitTab({ unit, onChange, errors }: UnitTabProps) {
  return (
    <div className="tab-content">
      <h3>Jednostka</h3>
      <div className="form-group">
        <label htmlFor="unit-name">Nazwa jednostki</label>
        <input
          id="unit-name"
          type="text"
          className={`form-input ${errors['name'] ? 'input-error' : ''}`}
          value={unit.name ?? ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="np. OIOM Szpital Miejski"
        />
        {errors['name'] && <span className="error-msg">{errors['name']}</span>}
      </div>
    </div>
  )
}
