import type { Assignment, Unit, Plan } from '@/types'

function eligibleDoctors(wardId: string, date: string, unit: Unit, plan: Plan, chromosome: Assignment[]): string[] {
  const exclusionSet = new Set(plan.exclusions.map((e) => `${e.doctorId}:${e.date}`))
  const usedOnDate = new Set(
    chromosome.filter((a) => a.date === date && a.doctorId).map((a) => a.doctorId as string),
  )

  const eligibilityMap = new Map<string, Set<string>>()
  for (const ward of unit.wards) {
    if (ward.allowedDoctorTypes.length > 0) {
      eligibilityMap.set(ward.id, new Set(ward.allowedDoctorTypes))
    }
  }

  return unit.doctors
    .filter((d) => {
      if (exclusionSet.has(`${d.id}:${date}`)) return false
      if (usedOnDate.has(d.id)) return false
      const allowed = eligibilityMap.get(wardId)
      if (allowed && !allowed.has(d.type)) return false
      return true
    })
    .map((d) => d.id)
}

function randomFrom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]!
}

export function seedChromosome(unit: Unit, plan: Plan): Assignment[] {
  const pinnedMap = new Map<string, Assignment>()
  for (const a of plan.assignments) {
    if (a.pinned) pinnedMap.set(`${a.date}:${a.wardId}`, a)
  }

  const chromosome: Assignment[] = []

  const dates = [...new Set(
    (plan.assignments.length > 0
      ? plan.assignments
      : generateSlotKeys(plan.year, plan.month, unit.wards.map((w) => w.id))
    ).map((a) => a.date),
  )].sort()

  for (const date of dates) {
    for (const ward of unit.wards) {
      const key = `${date}:${ward.id}`
      if (pinnedMap.has(key)) {
        chromosome.push({ ...pinnedMap.get(key)! })
        continue
      }
      const candidates = eligibleDoctors(ward.id, date, unit, plan, chromosome)
      chromosome.push({ date, wardId: ward.id, doctorId: randomFrom(candidates), pinned: false })
    }
  }
  return chromosome
}

function generateSlotKeys(year: number, month: number, wardIds: string[]): { date: string; wardId: string }[] {
  const days = new Date(year, month, 0).getDate()
  const slots: { date: string; wardId: string }[] = []
  for (let d = 1; d <= days; d++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    for (const wid of wardIds) slots.push({ date, wardId: wid })
  }
  return slots
}

export function seedPopulation(size: number, unit: Unit, plan: Plan): Assignment[][] {
  const pop: Assignment[][] = []
  for (let i = 0; i < size; i++) {
    pop.push(seedChromosome(unit, plan))
  }
  return pop
}

export function tournamentSelect(population: Assignment[][], fitnesses: number[], k = 3): Assignment[] {
  let best: number | null = null
  for (let i = 0; i < k; i++) {
    const idx = Math.floor(Math.random() * population.length)
    if (best === null || fitnesses[idx]! < fitnesses[best]!) best = idx
  }
  return population[best!]!
}

export function crossover(parentA: Assignment[], parentB: Assignment[], pinnedMap: Map<string, string | null>): Assignment[] {
  return parentA.map((a, i) => {
    const key = `${a.date}:${a.wardId}`
    if (pinnedMap.has(key)) {
      return { ...a, doctorId: pinnedMap.get(key)!, pinned: true }
    }
    return Math.random() < 0.5 ? { ...a } : { ...parentB[i]! }
  })
}

export function mutate(chromosome: Assignment[], unit: Unit, plan: Plan, mutationRate: number): Assignment[] {
  return chromosome.map((a) => {
    if (a.pinned) return a
    if (Math.random() >= mutationRate) return a
    const candidates = eligibleDoctors(a.wardId, a.date, unit, plan, chromosome)
    return { ...a, doctorId: randomFrom(candidates) }
  })
}
