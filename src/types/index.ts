export const SCHEMA_VERSION = 1

export type DoctorType = 'resident' | 'senior_resident' | 'specialist'

export interface Unit {
  id: string
  name: string
  wards: Ward[]
  doctors: Doctor[]
  rules: Rule[]
  defaultMaxDuties: number          // fallback cap per doctor; default 6
  allowConsecutiveDuties: boolean   // if false, consecutive days are a hard violation
}

export interface Ward {
  id: string
  name: string
  abbrev: string
  emoji: string | null
  allowedDoctorTypes: DoctorType[]  // empty = any type allowed
}

export interface Doctor {
  id: string
  firstName: string
  lastName: string
  type: DoctorType
}

export type Rule = DailyCountRule

export interface DailyCountRule {
  kind: 'daily_count'
  id: string
  doctorType: DoctorType
  minCount: number
}

export interface Plan {
  id: string
  unitId: string
  year: number
  month: number
  label: string | null
  exclusions: DoctorDateEntry[]
  assignments: Assignment[]
  doctorMaxDuties: Record<string, number>  // sparse overrides; absent = use unit.defaultMaxDuties
}

export function getEffectiveMaxDuties(plan: Plan, unit: Unit, doctorId: string): number {
  return plan.doctorMaxDuties[doctorId] ?? unit.defaultMaxDuties
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
