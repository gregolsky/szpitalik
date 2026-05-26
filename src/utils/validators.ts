import type { Unit, Ward, Tag, Rule } from '@/types'

const ABBREV_RE = /^[A-Z]{2,4}$/

export function validateWardAbbrev(abbrev: string): boolean {
  return ABBREV_RE.test(abbrev)
}

export function validateTagAllowedTypes(tag: Tag): boolean {
  return tag.allowedTypes.length > 0
}

export function validateRuleRefs(rule: Rule, unit: Unit): boolean {
  if (rule.kind === 'ward_eligibility') {
    const hasWard = unit.wards.some((w) => w.id === rule.wardId)
    const hasTag = unit.tags.some((t) => t.id === rule.tagId)
    return hasWard && hasTag
  }
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

  if (unit.tags) {
    for (const tag of unit.tags) {
      if (!validateTagAllowedTypes(tag)) {
        errors.push({ field: `tag.${tag.id}.allowedTypes`, message: `Tag "${tag.name}" musi mieć co najmniej jeden typ lekarza` })
      }
    }
  }

  return errors
}

export function validateWard(ward: Partial<Ward>): ValidationError[] {
  const errors: ValidationError[] = []
  if (!ward.name?.trim()) errors.push({ field: 'name', message: 'Nazwa pionu jest wymagana' })
  if (!ward.abbrev || !validateWardAbbrev(ward.abbrev)) {
    errors.push({ field: 'abbrev', message: 'Skrót musi mieć 2–4 duże litery (A–Z)' })
  }
  return errors
}
