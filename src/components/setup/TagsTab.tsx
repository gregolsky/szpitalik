import { useState } from 'react'
import type { Tag, DoctorType } from '@/types'
import { DOCTOR_TYPE_LABEL } from '@/types'
import { genId } from '@/utils/id'

interface TagsTabProps {
  tags: Tag[]
  onChange: (tags: Tag[]) => void
}

const ALL_TYPES: DoctorType[] = ['resident', 'senior_resident', 'specialist']
const EMPTY: Omit<Tag, 'id'> = { name: '', allowedTypes: [] }

export function TagsTab({ tags, onChange }: TagsTabProps) {
  const [editing, setEditing] = useState<Tag | null>(null)
  const [draft, setDraft] = useState<Omit<Tag, 'id'>>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function openNew() {
    setEditing({ id: genId(), ...EMPTY })
    setDraft(EMPTY)
    setErrors({})
  }

  function openEdit(t: Tag) {
    setEditing(t)
    setDraft({ name: t.name, allowedTypes: t.allowedTypes })
    setErrors({})
  }

  function toggleType(type: DoctorType) {
    setDraft((d) => ({
      ...d,
      allowedTypes: d.allowedTypes.includes(type)
        ? d.allowedTypes.filter((t) => t !== type)
        : [...d.allowedTypes, type],
    }))
  }

  function save() {
    if (!editing) return
    const errs: Record<string, string> = {}
    if (!draft.name.trim()) errs['name'] = 'Nazwa tagu jest wymagana'
    if (draft.allowedTypes.length === 0) errs['allowedTypes'] = 'Wybierz co najmniej jeden typ'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const tag: Tag = { ...editing, ...draft }
    const isNew = !tags.find((t) => t.id === tag.id)
    if (isNew) {
      onChange([...tags, tag])
    } else {
      onChange(tags.map((t) => (t.id === tag.id ? tag : t)))
    }
    setEditing(null)
  }

  function remove(id: string) {
    onChange(tags.filter((t) => t.id !== id))
  }

  return (
    <div className="tab-content">
      <h3>Tagi</h3>
      <p className="hint">Tag definiuje zestaw typów lekarzy uprawnionych do pełnienia dyżuru na danym pionie.</p>
      <table className="data-table">
        <thead>
          <tr><th>Nazwa</th><th>Dozwolone typy</th><th></th></tr>
        </thead>
        <tbody>
          {tags.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{t.allowedTypes.map((type) => DOCTOR_TYPE_LABEL[type]).join(', ')}</td>
              <td>
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)}>Edytuj</button>
                <button className="btn btn-sm btn-danger" onClick={() => remove(t.id)}>Usuń</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-primary" onClick={openNew}>+ Dodaj tag</button>

      {editing && (
        <div className="inline-form">
          <h4>{tags.find((t) => t.id === editing.id) ? 'Edytuj tag' : 'Nowy tag'}</h4>
          <div className="form-group">
            <label>Nazwa</label>
            <input
              className={`form-input ${errors['name'] ? 'input-error' : ''}`}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="np. specjalista_lub_starszy"
            />
            {errors['name'] && <span className="error-msg">{errors['name']}</span>}
          </div>
          <div className="form-group">
            <label>Dozwolone typy lekarzy</label>
            <div className="checkbox-group">
              {ALL_TYPES.map((type) => (
                <label key={type} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={draft.allowedTypes.includes(type)}
                    onChange={() => toggleType(type)}
                  />
                  {DOCTOR_TYPE_LABEL[type]}
                </label>
              ))}
            </div>
            {errors['allowedTypes'] && <span className="error-msg">{errors['allowedTypes']}</span>}
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
