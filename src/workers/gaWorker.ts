import type { Unit, Plan } from '@/types'
import { runGA, DEFAULT_GA_PARAMS } from '@/ga/run'

export interface WorkerStartMessage {
  type: 'start'
  unit: Unit
  plan: Plan
}

export interface WorkerCancelMessage {
  type: 'cancel'
}

export interface WorkerProgressMessage {
  type: 'progress'
  generation: number
  bestFitness: number
}

export interface WorkerResultMessage {
  type: 'result'
  assignments: import('@/types').Assignment[]
}

export interface WorkerErrorMessage {
  type: 'error'
  message: string
}

let cancelled = false

self.onmessage = (e: MessageEvent<WorkerStartMessage | WorkerCancelMessage>) => {
  const msg = e.data
  if (msg.type === 'cancel') {
    cancelled = true
    return
  }
  if (msg.type !== 'start') return

  cancelled = false
  const { unit, plan } = msg

  try {
    const result = runGA(
      unit,
      plan,
      (progress) => {
        self.postMessage({ type: 'progress', ...progress } satisfies WorkerProgressMessage)
      },
      DEFAULT_GA_PARAMS,
      () => cancelled,
    )
    self.postMessage({ type: 'result', assignments: result.assignments } satisfies WorkerResultMessage)
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) } satisfies WorkerErrorMessage)
  }
}
