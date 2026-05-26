import { useState } from 'react'
import type { Ward } from '@/types'
import { genId } from '@/utils/id'
import { validateWard } from '@/utils/validators'

interface WardsTabProps {
  wards: Ward[]
  onChange: (wards: Ward[]) => void
}

const EMPTY: Omit<Ward, 'id'> = { name: '', abbrev: '', emoji: null }

export function WardsTab({ wards, onChange }: WardsTabProps) {
  const [editing, setEditing] = useState<Ward | null>(null)
  const [draft, setDraft] = useState<Omit<Ward, 'id'>>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function openNew() {
    setEditing({ id: genId(), ...EMPTY })
    setDraft(EMPTY)
    setErrors({})
  }

  function openEdit(w: Ward) {
    setEditing(w)
    setDraft({ name: w.name, abbrev: w.abbrev, emoji: w.emoji })
    setErrors({})
  }

  function save() {
    if (!editing) return
    const errs = validateWard(draft)
    if (errs.length > 0) {
      setErrors(Object.fromEntries(errs.map((e) => [e.field, e.message])))
      return
    }
    const ward: Ward = { ...editing, ...draft, abbrev: draft.abbrev.toUpperCase() }
    const isNew = !wards.find((w) => w.id === ward.id)
    if (isNew) {
      onChange([...wards, ward])
    } else {
      onChange(wards.map((w) => (w.id === ward.id ? ward : w)))
    }
    setEditing(null)
  }

  function remove(id: string) {
    onChange(wards.filter((w) => w.id !== id))
  }

  return (
    <div className="tab-content">
      <h3>Piony</h3>
      <table className="data-table">
        <thead>
          <tr><th>Skrót</th><th>Nazwa</th><th>Emoji</th><th></th></tr>
        </thead>
        <tbody>
          {wards.map((w) => (
            <tr key={w.id}>
              <td><code>{w.abbrev}</code></td>
              <td>{w.name}</td>
              <td>{w.emoji ?? '—'}</td>
              <td>
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(w)}>Edytuj</button>
                <button className="btn btn-sm btn-danger" onClick={() => remove(w.id)}>Usuń</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-primary" onClick={openNew}>+ Dodaj pion</button>

      {editing && (
        <div className="inline-form">
          <h4>{wards.find((w) => w.id === editing.id) ? 'Edytuj pion' : 'Nowy pion'}</h4>
          <div className="form-group">
            <label>Skrót (2–4 litery)</label>
            <input
              className={`form-input ${errors['abbrev'] ? 'input-error' : ''}`}
              value={draft.abbrev}
              onChange={(e) => setDraft((d) => ({ ...d, abbrev: e.target.value.toUpperCase() }))}
              maxLength={4}
              placeholder="OIOM"
            />
            {errors['abbrev'] && <span className="error-msg">{errors['abbrev']}</span>}
          </div>
          <div className="form-group">
            <label>Nazwa</label>
            <input
              className={`form-input ${errors['name'] ? 'input-error' : ''}`}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Oddział intensywnej opieki medycznej"
            />
            {errors['name'] && <span className="error-msg">{errors['name']}</span>}
          </div>
          <div className="form-group">
            <label>Emoji (opcjonalne)</label>
            <input
              className="form-input"
              value={draft.emoji ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, emoji: e.target.value || null }))}
              maxLength={2}
              placeholder="🫁"
            />
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
