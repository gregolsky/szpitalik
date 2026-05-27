import type { Unit } from '@/types'
import { HelpIcon } from '@/components/common/HelpIcon'

interface UnitTabProps {
  unit: Partial<Unit>
  onChange: (patch: Partial<Unit>) => void
  errors: Record<string, string>
}

export function UnitTab({ unit, onChange, errors }: UnitTabProps) {
  return (
    <div className="tab-content">
      <div className="tab-heading-row">
        <h3>Jednostka</h3>
        <HelpIcon label="Pomoc — jednostka">
          <p>Jednostka to szpital, oddział lub specjalizacja, dla której tworzysz grafiki dyżurów.</p>
          <p>Nazwa pojawia się w nagłówku aplikacji i na wydrukach planu.</p>
        </HelpIcon>
      </div>
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
