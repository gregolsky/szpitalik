import type { Assignment, Unit, Plan } from '@/types'

export const PENALTY = {
  HARD: 1000,
  SOFT: 10,
  DISTRIBUTION: 50,
  NULL_SLOT: 100,
} as const

export function exclusionPenalty(assignments: Assignment[], plan: Plan): number {
  let penalty = 0
  const exclusionSet = new Set(plan.exclusions.map((e) => `${e.doctorId}:${e.date}`))
  for (const a of assignments) {
    if (a.doctorId && exclusionSet.has(`${a.doctorId}:${a.date}`)) {
      penalty += PENALTY.HARD
    }
  }
  return penalty
}

export function eligibilityPenalty(assignments: Assignment[], unit: Unit): number {
  let penalty = 0
  const eligibilityMap = new Map<string, Set<string>>()
  for (const rule of unit.rules) {
    if (rule.kind === 'ward_eligibility') {
      const tag = unit.tags.find((t) => t.id === rule.tagId)
      if (tag) {
        eligibilityMap.set(rule.wardId, new Set(tag.allowedTypes))
      }
    }
  }
  for (const a of assignments) {
    if (!a.doctorId) continue
    const allowed = eligibilityMap.get(a.wardId)
    if (!allowed) continue
    const doctor = unit.doctors.find((d) => d.id === a.doctorId)
    if (doctor && !allowed.has(doctor.type)) {
      penalty += PENALTY.HARD
    }
  }
  return penalty
}

export function doubleBookingPenalty(assignments: Assignment[]): number {
  let penalty = 0
  const byDoctorDate = new Map<string, number>()
  for (const a of assignments) {
    if (!a.doctorId) continue
    const key = `${a.doctorId}:${a.date}`
    byDoctorDate.set(key, (byDoctorDate.get(key) ?? 0) + 1)
  }
  for (const count of byDoctorDate.values()) {
    if (count > 1) {
      penalty += PENALTY.HARD * (count - 1)
    }
  }
  return penalty
}

export function pinnedSlotPenalty(assignments: Assignment[], pinnedAssignments: Assignment[]): number {
  let penalty = 0
  const pinnedMap = new Map<string, string | null>()
  for (const p of pinnedAssignments) {
    pinnedMap.set(`${p.date}:${p.wardId}`, p.doctorId)
  }
  for (const a of assignments) {
    const key = `${a.date}:${a.wardId}`
    if (pinnedMap.has(key) && a.doctorId !== pinnedMap.get(key)) {
      penalty += PENALTY.HARD
    }
  }
  return penalty
}

export function preferencesPenalty(assignments: Assignment[], plan: Plan): number {
  let penalty = 0
  const assignedSet = new Set(assignments.filter((a) => a.doctorId).map((a) => `${a.doctorId}:${a.date}`))
  for (const pref of plan.preferences) {
    if (!assignedSet.has(`${pref.doctorId}:${pref.date}`)) {
      penalty += PENALTY.SOFT
    }
  }
  return penalty
}

export function dailyCountPenalty(assignments: Assignment[], unit: Unit): number {
  let penalty = 0
  const countRules = unit.rules.filter((r) => r.kind === 'daily_count')
  if (countRules.length === 0) return 0

  const byDate = new Map<string, Assignment[]>()
  for (const a of assignments) {
    const list = byDate.get(a.date) ?? []
    list.push(a)
    byDate.set(a.date, list)
  }

  for (const [, dayAssignments] of byDate) {
    for (const rule of countRules) {
      if (rule.kind !== 'daily_count') continue
      const count = dayAssignments.filter((a) => {
        if (!a.doctorId) return false
        const doc = unit.doctors.find((d) => d.id === a.doctorId)
        return doc?.type === rule.doctorType
      }).length
      if (count < rule.minCount) {
        penalty += PENALTY.SOFT * (rule.minCount - count)
      }
    }
  }
  return penalty
}

export function distributionPenalty(assignments: Assignment[], unit: Unit): number {
  const counts = new Map<string, number>()
  for (const doc of unit.doctors) counts.set(doc.id, 0)
  for (const a of assignments) {
    if (a.doctorId) counts.set(a.doctorId, (counts.get(a.doctorId) ?? 0) + 1)
  }
  const values = [...counts.values()]
  if (values.length === 0) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  return values.reduce((sum, v) => sum + Math.abs(v - mean), 0) * PENALTY.DISTRIBUTION
}

export function nullSlotPenalty(assignments: Assignment[]): number {
  return assignments.filter((a) => !a.doctorId).length * PENALTY.NULL_SLOT
}

export function computeFitness(assignments: Assignment[], unit: Unit, plan: Plan): number {
  const pinned = plan.assignments.filter((a) => a.pinned)
  return (
    exclusionPenalty(assignments, plan) +
    eligibilityPenalty(assignments, unit) +
    doubleBookingPenalty(assignments) +
    pinnedSlotPenalty(assignments, pinned) +
    preferencesPenalty(assignments, plan) +
    dailyCountPenalty(assignments, unit) +
    distributionPenalty(assignments, unit) +
    nullSlotPenalty(assignments)
  )
}
