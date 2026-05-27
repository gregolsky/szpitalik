import { useState } from 'react'
import type { Rule, DailyCountRule, DoctorType } from '@/types'
import { HelpIcon } from '@/components/common/HelpIcon'
import { DOCTOR_TYPE_LABEL } from '@/types'
import { genId } from '@/utils/id'

interface RulesTabProps {
  rules: Rule[]
  defaultMaxDuties: number
  allowConsecutiveDuties: boolean
  onChange: (rules: Rule[]) => void
  onSettingsChange: (s: { defaultMaxDuties: number; allowConsecutiveDuties: boolean }) => void
}

export function RulesTab({ rules, defaultMaxDuties, allowConsecutiveDuties, onChange, onSettingsChange }: RulesTabProps) {
  const [editing, setEditing] = useState<Partial<DailyCountRule> | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function openNew() {
    setErrors({})
    setEditing({ id: genId(), kind: 'daily_count', doctorType: 'specialist', minCount: 1 })
  }

  function save() {
    if (!editing) return
    const errs: Record<string, string> = {}
    if (!editing.minCount || editing.minCount < 1) errs['minCount'] = 'Minimalna liczba musi być ≥ 1'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const rule = editing as DailyCountRule
    const isNew = !rules.find((r) => r.id === rule.id)
    if (isNew) onChange([...rules, rule])
    else onChange(rules.map((r) => (r.id === rule.id ? rule : r)))
    setEditing(null)
  }

  function remove(id: string) {
    onChange(rules.filter((r) => r.id !== id))
  }

  return (
    <div className="tab-content">
      <div className="tab-heading-row">
        <h3>Ustawienia ogólne</h3>
        <HelpIcon label="Pomoc — ustawienia i reguły">
          <p>Limit dyżurów to domyślna maksymalna liczba dyżurów na lekarza w planie miesięcznym (można nadpisać dla każdego lekarza osobno w widoku planu).</p>
          <p>Reguły dziennej liczby wymuszają minimalną obsadę danego typu lekarza w każdym dniu — algorytm genetyczny stara się je spełnić.</p>
        </HelpIcon>
      </div>
      <div className="form-group">
        <label>Domyślny limit dyżurów na osobę (na plan)</label>
        <input
          type="number"
          min={0}
          max={31}
          className="form-input"
          style={{ width: '80px' }}
          value={defaultMaxDuties}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (Number.isInteger(v) && v >= 0 && v <= 31) {
              onSettingsChange({ defaultMaxDuties: v, allowConsecutiveDuties })
            }
          }}
        />
      </div>
      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={allowConsecutiveDuties}
            onChange={(e) => onSettingsChange({ defaultMaxDuties, allowConsecutiveDuties: e.target.checked })}
          />
          Zezwól na dyżury dzień po dniu
        </label>
        <p className="hint">Domyślnie blokujemy dyżury dwa dni z rzędu dla tego samego lekarza.</p>
      </div>

      <h3>Reguły</h3>
      <p className="hint">Reguły dziennej liczby wymagają minimalnej obsady danego typu lekarza każdego dnia.</p>
      <table className="data-table">
        <thead>
          <tr><th>Typ lekarza</th><th>Min. dziennie</th><th></th></tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id}>
              <td>{DOCTOR_TYPE_LABEL[r.doctorType]}</td>
              <td>{r.minCount}</td>
              <td>
                <button className="btn btn-sm btn-danger" onClick={() => remove(r.id)}>Usuń</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-primary" onClick={openNew}>+ Dodaj regułę</button>

      {editing && (
        <div className="inline-form">
          <h4>Nowa reguła dziennej liczby</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Typ lekarza</label>
              <select
                className="form-input"
                value={editing.doctorType}
                onChange={(e) => setEditing((r) => ({ ...r!, doctorType: e.target.value as DoctorType }))}
              >
                {(['resident', 'senior_resident', 'specialist'] as DoctorType[]).map((t) => (
                  <option key={t} value={t}>{DOCTOR_TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Minimalna liczba dziennie</label>
              <input
                type="number"
                min={1}
                className={`form-input ${errors['minCount'] ? 'input-error' : ''}`}
                value={editing.minCount ?? 1}
                onChange={(e) => setEditing((r) => ({ ...r!, minCount: parseInt(e.target.value) }))}
              />
              {errors['minCount'] && <span className="error-msg">{errors['minCount']}</span>}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save}>Zapisz</button>
            <button className="btn btn-secondary" onClick={() => setEditing(null)}>Anuluj</button>
          </div>
        </div>
      )}
    </div>
  )
}
