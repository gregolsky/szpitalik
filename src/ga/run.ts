import type { Assignment, Unit, Plan } from '@/types'
import { computeFitness } from './fitness'
import { seedPopulation, tournamentSelect, crossover, mutate } from './operators'

export interface GAParams {
  populationSize: number
  generations: number
  mutationRate: number
  crossoverRate: number
  eliteFraction: number
}

export const DEFAULT_GA_PARAMS: GAParams = {
  populationSize: 100,
  generations: 500,
  mutationRate: 0.05,
  crossoverRate: 0.8,
  eliteFraction: 0.1,
}

export interface GAProgress {
  generation: number
  bestFitness: number
}

export interface GAResult {
  assignments: Assignment[]
  fitness: number
}

export function runGA(
  unit: Unit,
  plan: Plan,
  onProgress: (p: GAProgress) => void,
  params: GAParams = DEFAULT_GA_PARAMS,
  isCancelled: () => boolean = () => false,
): GAResult {
  const pinnedMap = new Map<string, string | null>()
  for (const a of plan.assignments) {
    if (a.pinned) pinnedMap.set(`${a.date}:${a.wardId}`, a.doctorId)
  }

  let population = seedPopulation(params.populationSize, unit, plan)
  let fitnesses = population.map((c) => computeFitness(c, unit, plan))

  const eliteCount = Math.max(1, Math.floor(params.populationSize * params.eliteFraction))

  for (let gen = 0; gen < params.generations; gen++) {
    if (isCancelled()) break

    const sorted = fitnesses
      .map((f, i) => ({ f, i }))
      .sort((a, b) => a.f - b.f)

    if (gen % 20 === 0 || gen === params.generations - 1) {
      onProgress({ generation: gen, bestFitness: sorted[0]!.f })
    }

    if (sorted[0]!.f === 0) break

    const newPop: Assignment[][] = []
    for (let e = 0; e < eliteCount; e++) {
      newPop.push([...population[sorted[e]!.i]!])
    }

    while (newPop.length < params.populationSize) {
      const parentA = tournamentSelect(population, fitnesses)
      const parentB = tournamentSelect(population, fitnesses)

      let child: Assignment[]
      if (Math.random() < params.crossoverRate) {
        child = crossover(parentA, parentB, pinnedMap)
      } else {
        child = [...parentA]
      }
      child = mutate(child, unit, plan, params.mutationRate)
      newPop.push(child)
    }

    population = newPop
    fitnesses = population.map((c) => computeFitness(c, unit, plan))
  }

  const bestIdx = fitnesses.reduce((best, f, i) => (f < fitnesses[best]! ? i : best), 0)
  return { assignments: population[bestIdx]!, fitness: fitnesses[bestIdx]! }
}
