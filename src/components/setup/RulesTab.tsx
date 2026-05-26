import { useState } from 'react'
import type { Rule, DailyCountRule, WardEligibilityRule, Ward, Tag, DoctorType } from '@/types'
import { DOCTOR_TYPE_LABEL } from '@/types'
import { genId } from '@/utils/id'

interface RulesTabProps {
  rules: Rule[]
  wards: Ward[]
  tags: Tag[]
  onChange: (rules: Rule[]) => void
}

type RuleKind = 'daily_count' | 'ward_eligibility'

export function RulesTab({ rules, wards, tags, onChange }: RulesTabProps) {
  const [kind, setKind] = useState<RuleKind>('daily_count')
  const [editingCount, setEditingCount] = useState<Partial<DailyCountRule> | null>(null)
  const [editingElig, setEditingElig] = useState<Partial<WardEligibilityRule> | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function openNew() {
    setErrors({})
    if (kind === 'daily_count') {
      setEditingCount({ id: genId(), kind: 'daily_count', doctorType: 'specialist', minCount: 1 })
    } else {
      setEditingElig({ id: genId(), kind: 'ward_eligibility', wardId: wards[0]?.id, tagId: tags[0]?.id })
    }
  }

  function saveCount() {
    if (!editingCount) return
    const errs: Record<string, string> = {}
    if (!editingCount.minCount || editingCount.minCount < 1) errs['minCount'] = 'Minimalna liczba musi być ≥ 1'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const rule = editingCount as DailyCountRule
    const isNew = !rules.find((r) => r.id === rule.id)
    if (isNew) onChange([...rules, rule])
    else onChange(rules.map((r) => (r.id === rule.id ? rule : r)))
    setEditingCount(null)
  }

  function saveElig() {
    if (!editingElig) return
    const errs: Record<string, string> = {}
    if (!editingElig.wardId) errs['wardId'] = 'Wybierz pion'
    if (!editingElig.tagId) errs['tagId'] = 'Wybierz tag'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const rule = editingElig as WardEligibilityRule
    const isNew = !rules.find((r) => r.id === rule.id)
    if (isNew) onChange([...rules, rule])
    else onChange(rules.map((r) => (r.id === rule.id ? rule : r)))
    setEditingElig(null)
  }

  function remove(id: string) {
    onChange(rules.filter((r) => r.id !== id))
  }

  function ruleDescription(rule: Rule): string {
    if (rule.kind === 'daily_count') {
      return `Min. ${rule.minCount} × ${DOCTOR_TYPE_LABEL[rule.doctorType]} dziennie`
    }
    const ward = wards.find((w) => w.id === rule.wardId)
    const tag = tags.find((t) => t.id === rule.tagId)
    return `Pion "${ward?.name ?? rule.wardId}" wymaga tagu "${tag?.name ?? rule.tagId}"`
  }

  const editing = editingCount !== null || editingElig !== null

  return (
    <div className="tab-content">
      <h3>Reguły</h3>
      <table className="data-table">
        <thead>
          <tr><th>Typ</th><th>Opis</th><th></th></tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id}>
              <td>{r.kind === 'daily_count' ? 'Dzienna liczba' : 'Eligibilność pionu'}</td>
              <td>{ruleDescription(r)}</td>
              <td>
                <button className="btn btn-sm btn-danger" onClick={() => remove(r.id)}>Usuń</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!editing && (
        <div className="form-row">
          <select className="form-input" value={kind} onChange={(e) => setKind(e.target.value as RuleKind)}>
            <option value="daily_count">Dzienna liczba lekarzy</option>
            <option value="ward_eligibility">Eligibilność pionu</option>
          </select>
          <button className="btn btn-primary" onClick={openNew}>+ Dodaj regułę</button>
        </div>
      )}

      {editingCount && (
        <div className="inline-form">
          <h4>Nowa reguła dziennej liczby</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Typ lekarza</label>
              <select
                className="form-input"
                value={editingCount.doctorType}
                onChange={(e) => setEditingCount((r) => ({ ...r!, doctorType: e.target.value as DoctorType }))}
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
                value={editingCount.minCount ?? 1}
                onChange={(e) => setEditingCount((r) => ({ ...r!, minCount: parseInt(e.target.value) }))}
              />
              {errors['minCount'] && <span className="error-msg">{errors['minCount']}</span>}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={saveCount}>Zapisz</button>
            <button className="btn btn-secondary" onClick={() => setEditingCount(null)}>Anuluj</button>
          </div>
        </div>
      )}

      {editingElig && (
        <div className="inline-form">
          <h4>Nowa reguła eligibilności pionu</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Pion</label>
              <select
                className={`form-input ${errors['wardId'] ? 'input-error' : ''}`}
                value={editingElig.wardId ?? ''}
                onChange={(e) => setEditingElig((r) => ({ ...r!, wardId: e.target.value }))}
              >
                <option value="">— wybierz —</option>
                {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              {errors['wardId'] && <span className="error-msg">{errors['wardId']}</span>}
            </div>
            <div className="form-group">
              <label>Tag</label>
              <select
                className={`form-input ${errors['tagId'] ? 'input-error' : ''}`}
                value={editingElig.tagId ?? ''}
                onChange={(e) => setEditingElig((r) => ({ ...r!, tagId: e.target.value }))}
              >
                <option value="">— wybierz —</option>
                {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors['tagId'] && <span className="error-msg">{errors['tagId']}</span>}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={saveElig}>Zapisz</button>
            <button className="btn btn-secondary" onClick={() => setEditingElig(null)}>Anuluj</button>
          </div>
        </div>
      )}
    </div>
  )
}
