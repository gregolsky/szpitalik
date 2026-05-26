import type { Unit, Ward, Rule } from '@/types'

const ABBREV_RE = /^[A-Z]{2,4}$/

export function validateWardAbbrev(abbrev: string): boolean {
  return ABBREV_RE.test(abbrev)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validateRuleRefs(_rule: Rule, _unit: Unit): boolean {
  return true
}

export interface ValidationError {
  field: string
  message: string
}

export function validateUnit(unit: Partial<Unit>): ValidationError[] {
  const errors: ValidationError[] = []

  if (!unit.name?.trim()) {
    errors.push({ field: 'name', message: 'Nazwa jednostki jest wymagana' })
  }

  if (unit.defaultMaxDuties !== undefined && !validateMaxDutiesValue(unit.defaultMaxDuties)) {
    errors.push({ field: 'defaultMaxDuties', message: 'Domyślny limit dyżurów musi być liczbą całkowitą 0–31' })
  }

  if (unit.wards) {
    for (const ward of unit.wards) {
      if (!validateWardAbbrev(ward.abbrev)) {
        errors.push({ field: `ward.${ward.id}.abbrev`, message: `Skrót pionatu "${ward.name}" musi mieć 2–4 duże litery` })
      }
    }

    const abbrevs = unit.wards.map((w) => w.abbrev)
    const uniqueAbbrevs = new Set(abbrevs)
    if (abbrevs.length !== uniqueAbbrevs.size) {
      errors.push({ field: 'wards.abbrev', message: 'Skróty pionatów muszą być unikalne' })
    }
  }

  return errors
}

export function validateMaxDutiesValue(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 31
}

export function validateWard(ward: Partial<Ward>): ValidationError[] {
  const errors: ValidationError[] = []
  if (!ward.name?.trim()) errors.push({ field: 'name', message: 'Nazwa pionu jest wymagana' })
  if (!ward.abbrev || !validateWardAbbrev(ward.abbrev)) {
    errors.push({ field: 'abbrev', message: 'Skrót musi mieć 2–4 duże litery (A–Z)' })
  }
  return errors
}
