import { useState } from 'react'
import type { Ward, DoctorType } from '@/types'
import { HelpIcon } from '@/components/common/HelpIcon'
import { DOCTOR_TYPE_LABEL } from '@/types'
import { genId } from '@/utils/id'
import { validateWard } from '@/utils/validators'
import { EmojiPickerField } from '@/components/common/EmojiPickerField'

interface WardsTabProps {
  wards: Ward[]
  onChange: (wards: Ward[]) => void
}

const ALL_TYPES: DoctorType[] = ['resident', 'senior_resident', 'specialist']
const EMPTY: Omit<Ward, 'id'> = { name: '', abbrev: '', emoji: null, allowedDoctorTypes: [] }

function autoAbbrev(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4)
}

export function WardsTab({ wards, onChange }: WardsTabProps) {
  const [editing, setEditing] = useState<Ward | null>(null)
  const [draft, setDraft] = useState<Omit<Ward, 'id'>>(EMPTY)
  const [abbrevAuto, setAbbrevAuto] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function openNew() {
    setEditing({ id: genId(), ...EMPTY })
    setDraft(EMPTY)
    setAbbrevAuto(true)
    setErrors({})
  }

  function openEdit(w: Ward) {
    setEditing(w)
    setDraft({ name: w.name, abbrev: w.abbrev, emoji: w.emoji, allowedDoctorTypes: w.allowedDoctorTypes })
    setAbbrevAuto(false)
    setErrors({})
  }

  function handleNameChange(name: string) {
    if (abbrevAuto) {
      setDraft((d) => ({ ...d, name, abbrev: autoAbbrev(name) }))
    } else {
      setDraft((d) => ({ ...d, name }))
    }
  }

  function toggleType(type: DoctorType) {
    setDraft((d) => ({
      ...d,
      allowedDoctorTypes: d.allowedDoctorTypes.includes(type)
        ? d.allowedDoctorTypes.filter((t) => t !== type)
        : [...d.allowedDoctorTypes, type],
    }))
  }

  function handleAbbrevChange(abbrev: string) {
    setAbbrevAuto(false)
    setDraft((d) => ({ ...d, abbrev: abbrev.toUpperCase() }))
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
      <div className="tab-heading-row">
        <h3>Piony</h3>
        <HelpIcon label="Pomoc — piony">
          <p>Pion to nazwane stanowisko dyżurowe wypełniane każdego dnia dyżurowego (np. OIOM, ANES).</p>
          <p>Skrót (2–4 litery) i emoji są widoczne w siatce planu. Możesz ograniczyć, które typy lekarzy mogą pełnić dyżur na danym pionie.</p>
        </HelpIcon>
      </div>
      <table className="data-table">
        <thead>
          <tr><th>Skrót</th><th>Nazwa</th><th>Emoji</th><th>Dozwolone typy</th><th></th></tr>
        </thead>
        <tbody>
          {wards.map((w) => (
            <tr key={w.id}>
              <td><code>{w.abbrev}</code></td>
              <td>{w.name}</td>
              <td>{w.emoji ?? '—'}</td>
              <td>{w.allowedDoctorTypes.length === 0 ? '—' : w.allowedDoctorTypes.map((t) => DOCTOR_TYPE_LABEL[t]).join(', ')}</td>
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
            <label>Nazwa</label>
            <input
              className={`form-input ${errors['name'] ? 'input-error' : ''}`}
              value={draft.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Oddział intensywnej opieki medycznej"
            />
            {errors['name'] && <span className="error-msg">{errors['name']}</span>}
          </div>
          <div className="form-group">
            <label>
              Skrót (2–4 litery)
              {abbrevAuto && <span className="hint" style={{ marginLeft: '0.5rem' }}>generowany automatycznie</span>}
            </label>
            <input
              className={`form-input ${errors['abbrev'] ? 'input-error' : ''}`}
              value={draft.abbrev}
              onChange={(e) => handleAbbrevChange(e.target.value)}
              maxLength={4}
              placeholder="OIOM"
            />
            {errors['abbrev'] && <span className="error-msg">{errors['abbrev']}</span>}
          </div>
          <div className="form-group">
            <label>Dozwolone typy lekarzy</label>
            <div className="checkbox-group">
              {ALL_TYPES.map((type) => (
                <label key={type} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={draft.allowedDoctorTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  {DOCTOR_TYPE_LABEL[type]}
                </label>
              ))}
            </div>
            <p className="hint">Pozostaw puste = wszystkie typy dozwolone.</p>
          </div>
          <div className="form-group">
            <label>Emoji (opcjonalne)</label>
            <EmojiPickerField
              value={draft.emoji}
              onChange={(emoji) => setDraft((d) => ({ ...d, emoji }))}
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
