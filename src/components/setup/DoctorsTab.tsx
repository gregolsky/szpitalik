import { useState } from 'react'
import type { Doctor, DoctorType } from '@/types'
import { HelpIcon } from '@/components/common/HelpIcon'
import { DOCTOR_TYPE_LABEL, DOCTOR_TYPE_EMOJI } from '@/types'
import { genId } from '@/utils/id'

interface DoctorsTabProps {
  doctors: Doctor[]
  onChange: (doctors: Doctor[]) => void
}

const TYPES: DoctorType[] = ['resident', 'senior_resident', 'specialist']
const EMPTY: Omit<Doctor, 'id'> = { firstName: '', lastName: '', type: 'resident' }

export function DoctorsTab({ doctors, onChange }: DoctorsTabProps) {
  const [editing, setEditing] = useState<Doctor | null>(null)
  const [draft, setDraft] = useState<Omit<Doctor, 'id'>>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function openNew() {
    setEditing({ id: genId(), ...EMPTY })
    setDraft(EMPTY)
    setErrors({})
  }

  function openEdit(d: Doctor) {
    setEditing(d)
    setDraft({ firstName: d.firstName, lastName: d.lastName, type: d.type })
    setErrors({})
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!draft.firstName.trim()) errs['firstName'] = 'Imię jest wymagane'
    if (!draft.lastName.trim()) errs['lastName'] = 'Nazwisko jest wymagane'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function save() {
    if (!editing) return
    if (!validate()) return
    const doctor: Doctor = { ...editing, ...draft }
    const isNew = !doctors.find((d) => d.id === doctor.id)
    if (isNew) {
      onChange([...doctors, doctor])
    } else {
      onChange(doctors.map((d) => (d.id === doctor.id ? doctor : d)))
    }
    setEditing(null)
  }

  function remove(id: string) {
    onChange(doctors.filter((d) => d.id !== id))
  }

  const sorted = [...doctors].sort((a, b) => a.lastName.localeCompare(b.lastName, 'pl'))

  return (
    <div className="tab-content">
      <div className="tab-heading-row">
        <h3>Lekarze</h3>
        <HelpIcon label="Pomoc — lekarze">
          <p>Trzy typy: Rezydent 🩺, Starszy rezydent 🔬, Specjalista ⭐. Typ decyduje o tym, do jakich pionów lekarz może być przypisany (wg reguł i typów dozwolonych w pionie).</p>
          <p>Lista jest sortowana alfabetycznie po nazwisku.</p>
        </HelpIcon>
      </div>
      <table className="data-table">
        <thead>
          <tr><th>Lekarz</th><th>Typ</th><th></th></tr>
        </thead>
        <tbody>
          {sorted.map((d) => (
            <tr key={d.id}>
              <td>{DOCTOR_TYPE_EMOJI[d.type]} {d.lastName} {d.firstName}</td>
              <td>{DOCTOR_TYPE_LABEL[d.type]}</td>
              <td>
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(d)}>Edytuj</button>
                <button className="btn btn-sm btn-danger" onClick={() => remove(d.id)}>Usuń</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="btn btn-primary" onClick={openNew}>+ Dodaj lekarza</button>

      {editing && (
        <div className="inline-form">
          <h4>{doctors.find((d) => d.id === editing.id) ? 'Edytuj lekarza' : 'Nowy lekarz'}</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Imię</label>
              <input
                className={`form-input ${errors['firstName'] ? 'input-error' : ''}`}
                value={draft.firstName}
                onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
              />
              {errors['firstName'] && <span className="error-msg">{errors['firstName']}</span>}
            </div>
            <div className="form-group">
              <label>Nazwisko</label>
              <input
                className={`form-input ${errors['lastName'] ? 'input-error' : ''}`}
                value={draft.lastName}
                onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
              />
              {errors['lastName'] && <span className="error-msg">{errors['lastName']}</span>}
            </div>
          </div>
          <div className="form-group">
            <label>Typ</label>
            <select
              className="form-input"
              value={draft.type}
              onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as DoctorType }))}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{DOCTOR_TYPE_EMOJI[t]} {DOCTOR_TYPE_LABEL[t]}</option>
              ))}
            </select>
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
