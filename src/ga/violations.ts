import type { Unit, Plan } from '@/types'
import { DOCTOR_TYPE_LABEL, getEffectiveMaxDuties } from '@/types'

export interface Violation {
  kind: 'exclusion' | 'eligibility' | 'double_booking' | 'consecutive' | 'null_slot' | 'max_duties' | 'daily_count'
  severity: 'hard' | 'soft'
  message: string
}

function fmtDate(date: string): string {
  const parts = date.split('-')
  return `${parts[2]}.${parts[1]}`
}

function pluralDuty(n: number): string {
  if (n === 1) return 'dyżur'
  if (n >= 2 && n <= 4) return 'dyżury'
  return 'dyżurów'
}

export function evaluateViolations(plan: Plan, unit: Unit): Violation[] {
  const violations: Violation[] = []
  const { assignments } = plan

  const doctorMap = new Map(unit.doctors.map((d) => [d.id, d]))
  const wardMap = new Map(unit.wards.map((w) => [w.id, w]))
  const docName = (id: string) => {
    const d = doctorMap.get(id)
    return d ? `${d.lastName} ${d.firstName[0]}.` : '?'
  }

  // Exclusion: assigned on excluded date
  const exclusionSet = new Set(plan.exclusions.map((e) => `${e.doctorId}:${e.date}`))
  for (const a of assignments) {
    if (a.doctorId && exclusionSet.has(`${a.doctorId}:${a.date}`)) {
      violations.push({
        kind: 'exclusion',
        severity: 'hard',
        message: `${docName(a.doctorId)} — dyżur ${fmtDate(a.date)} mimo wykluczenia`,
      })
    }
  }

  // Eligibility: wrong doctor type for ward
  for (const a of assignments) {
    if (!a.doctorId) continue
    const ward = wardMap.get(a.wardId)
    if (!ward || ward.allowedDoctorTypes.length === 0) continue
    const doc = doctorMap.get(a.doctorId)
    if (doc && !ward.allowedDoctorTypes.includes(doc.type)) {
      violations.push({
        kind: 'eligibility',
        severity: 'hard',
        message: `${docName(a.doctorId)} (${DOCTOR_TYPE_LABEL[doc.type]}) — niedopuszczalny na pion ${ward.name}`,
      })
    }
  }

  // Double booking: same doctor, same day, multiple wards
  const byDoctorDate = new Map<string, number>()
  for (const a of assignments) {
    if (!a.doctorId) continue
    const key = `${a.doctorId}:${a.date}`
    byDoctorDate.set(key, (byDoctorDate.get(key) ?? 0) + 1)
  }
  for (const [key, count] of byDoctorDate) {
    if (count > 1) {
      const [doctorId, date] = key.split(':') as [string, string]
      violations.push({
        kind: 'double_booking',
        severity: 'hard',
        message: `${docName(doctorId)} — dwa dyżury w dniu ${fmtDate(date)}`,
      })
    }
  }

  // Consecutive duties
  if (!unit.allowConsecutiveDuties) {
    const byDoctor = new Map<string, string[]>()
    for (const a of assignments) {
      if (!a.doctorId) continue
      const dates = byDoctor.get(a.doctorId) ?? []
      dates.push(a.date)
      byDoctor.set(a.doctorId, dates)
    }
    for (const [doctorId, dates] of byDoctor) {
      const sorted = dates.slice().sort()
      for (let i = 1; i < sorted.length; i++) {
        const diff = new Date(sorted[i]!).getTime() - new Date(sorted[i - 1]!).getTime()
        if (diff === 86_400_000) {
          violations.push({
            kind: 'consecutive',
            severity: 'hard',
            message: `${docName(doctorId)} — dyżury w kolejnych dniach: ${fmtDate(sorted[i - 1]!)} i ${fmtDate(sorted[i]!)}`,
          })
        }
      }
    }
  }

  // Null slots — grouped by ward
  const nullByWard = new Map<string, number>()
  for (const a of assignments) {
    if (!a.doctorId) nullByWard.set(a.wardId, (nullByWard.get(a.wardId) ?? 0) + 1)
  }
  for (const [wardId, count] of nullByWard) {
    violations.push({
      kind: 'null_slot',
      severity: 'soft',
      message: `Pion ${wardMap.get(wardId)?.name ?? wardId} — ${count} nieobsadzonych ${pluralDuty(count)}`,
    })
  }

  // Max duties exceeded — per doctor
  const countByDoctor = new Map<string, number>()
  for (const a of assignments) {
    if (a.doctorId) countByDoctor.set(a.doctorId, (countByDoctor.get(a.doctorId) ?? 0) + 1)
  }
  for (const doc of unit.doctors) {
    const cap = getEffectiveMaxDuties(plan, unit, doc.id)
    if (cap === 0) continue
    const count = countByDoctor.get(doc.id) ?? 0
    if (count > cap) {
      violations.push({
        kind: 'max_duties',
        severity: 'soft',
        message: `${docName(doc.id)} — przekracza limit: ${count}/${cap} dyżurów`,
      })
    }
  }

  // Daily count rules — grouped per rule
  const countRules = unit.rules.filter((r) => r.kind === 'daily_count')
  if (countRules.length > 0) {
    const byDate = new Map<string, typeof assignments>()
    for (const a of assignments) {
      const list = byDate.get(a.date) ?? []
      list.push(a)
      byDate.set(a.date, list)
    }
    for (const rule of countRules) {
      if (rule.kind !== 'daily_count') continue
      let violatedDays = 0
      for (const dayAssignments of byDate.values()) {
        const count = dayAssignments.filter((a) => a.doctorId && doctorMap.get(a.doctorId)?.type === rule.doctorType).length
        if (count < rule.minCount) violatedDays++
      }
      if (violatedDays > 0) {
        violations.push({
          kind: 'daily_count',
          severity: 'soft',
          message: `${DOCTOR_TYPE_LABEL[rule.doctorType]} — niewystarczająca obsada w ${violatedDays} ${violatedDays === 1 ? 'dniu' : 'dniach'} (wymagane min. ${rule.minCount})`,
        })
      }
    }
  }

  return violations
}
