export const SCHEMA_VERSION = 1

export type DoctorType = 'resident' | 'senior_resident' | 'specialist'

export interface Unit {
  id: string
  name: string
  wards: Ward[]
  doctors: Doctor[]
  tags: Tag[]
  rules: Rule[]
}

export interface Ward {
  id: string
  name: string
  abbrev: string
  emoji: string | null
}

export interface Doctor {
  id: string
  firstName: string
  lastName: string
  type: DoctorType
}

export interface Tag {
  id: string
  name: string
  allowedTypes: DoctorType[]
}

export type Rule = DailyCountRule | WardEligibilityRule

export interface DailyCountRule {
  kind: 'daily_count'
  id: string
  doctorType: DoctorType
  minCount: number
}

export interface WardEligibilityRule {
  kind: 'ward_eligibility'
  id: string
  wardId: string
  tagId: string
}

export interface Plan {
  id: string
  unitId: string
  year: number
  month: number
  label: string | null
  preferences: DoctorDateEntry[]
  exclusions: DoctorDateEntry[]
  assignments: Assignment[]
}

export interface DoctorDateEntry {
  doctorId: string
  date: string
}

export interface Assignment {
  date: string
  wardId: string
  doctorId: string | null
  pinned: boolean
}

export const DOCTOR_TYPE_EMOJI: Record<DoctorType, string> = {
  resident: '🩺',
  senior_resident: '🔬',
  specialist: '⭐',
}

export const DOCTOR_TYPE_LABEL: Record<DoctorType, string> = {
  resident: 'Rezydent',
  senior_resident: 'Starszy rezydent',
  specialist: 'Specjalista',
}
