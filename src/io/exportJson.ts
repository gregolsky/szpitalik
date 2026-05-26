import type { Unit, Plan } from '@/types'
import { SCHEMA_VERSION } from '@/types'

export interface FullSnapshot {
  schemaVersion: typeof SCHEMA_VERSION
  type: 'full_snapshot'
  unit: Unit
  plans: Plan[]
}

export interface SinglePlanExport {
  schemaVersion: typeof SCHEMA_VERSION
  type: 'single_plan'
  unitRef: { id: string; name: string }
  plan: Plan
}

export type ExportPayload = FullSnapshot | SinglePlanExport

function downloadJson(filename: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportFullSnapshot(unit: Unit, plans: Plan[]): void {
  const payload: FullSnapshot = { schemaVersion: SCHEMA_VERSION, type: 'full_snapshot', unit, plans }
  downloadJson(`${unit.name}_snapshot.json`, payload)
}

export function exportSinglePlan(unit: Unit, plan: Plan): void {
  const payload: SinglePlanExport = {
    schemaVersion: SCHEMA_VERSION,
    type: 'single_plan',
    unitRef: { id: unit.id, name: unit.name },
    plan,
  }
  const label = plan.label ? `_${plan.label}` : ''
  downloadJson(`plan_${plan.year}_${plan.month}${label}.json`, payload)
}
