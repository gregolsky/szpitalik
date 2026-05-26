import type { Unit, Plan } from '@/types'
import { SCHEMA_VERSION } from '@/types'
import type { ExportPayload } from './exportJson'

export interface ImportResult {
  type: 'full_snapshot' | 'single_plan'
  unit: Unit
  plans: Plan[]
  plan?: Plan
}

export class ImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportError'
  }
}

export function parseImportFile(json: string): ExportPayload {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new ImportError('Nieprawidłowy plik JSON')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new ImportError('Nieprawidłowy format pliku')
  }

  const p = parsed as Record<string, unknown>

  if (p['schemaVersion'] !== SCHEMA_VERSION) {
    throw new ImportError(`Nieobsługiwana wersja schematu: ${p['schemaVersion']}`)
  }

  if (p['type'] !== 'full_snapshot' && p['type'] !== 'single_plan') {
    throw new ImportError(`Nieznany typ pliku: ${p['type']}`)
  }

  return parsed as ExportPayload
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new ImportError('Błąd odczytu pliku'))
    reader.readAsText(file)
  })
}
