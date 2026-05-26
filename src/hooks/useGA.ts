import { useRef, useState, useCallback } from 'react'
import type { Unit, Plan, Assignment } from '@/types'
import type { WorkerStartMessage, WorkerProgressMessage, WorkerResultMessage, WorkerErrorMessage } from '@/workers/gaWorker'

export interface GAProgress {
  generation: number
  bestFitness: number
}

export interface UseGAResult {
  running: boolean
  progress: GAProgress | null
  run: (unit: Unit, plan: Plan) => Promise<Assignment[]>
  cancel: () => void
}

export function useGA(): UseGAResult {
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<GAProgress | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const cancel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'cancel' })
      workerRef.current.terminate()
      workerRef.current = null
    }
    setRunning(false)
  }, [])

  const run = useCallback((unit: Unit, plan: Plan): Promise<Assignment[]> => {
    cancel()
    setRunning(true)
    setProgress(null)

    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../workers/gaWorker.ts', import.meta.url), { type: 'module' })
      workerRef.current = worker

      worker.onmessage = (e: MessageEvent<WorkerProgressMessage | WorkerResultMessage | WorkerErrorMessage>) => {
        const msg = e.data
        if (msg.type === 'progress') {
          setProgress({ generation: msg.generation, bestFitness: msg.bestFitness })
        } else if (msg.type === 'result') {
          setRunning(false)
          worker.terminate()
          workerRef.current = null
          resolve(msg.assignments)
        } else if (msg.type === 'error') {
          setRunning(false)
          worker.terminate()
          workerRef.current = null
          reject(new Error(msg.message))
        }
      }

      worker.onerror = (e) => {
        setRunning(false)
        worker.terminate()
        workerRef.current = null
        reject(new Error(e.message))
      }

      const startMsg: WorkerStartMessage = { type: 'start', unit, plan }
      worker.postMessage(startMsg)
    })
  }, [cancel])

  return { running, progress, run, cancel }
}
