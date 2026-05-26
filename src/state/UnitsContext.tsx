import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Unit } from '@/types'
import { getAllUnits, putUnit, deleteUnit as dbDeleteUnit } from '@/storage/db'

interface UnitsContextValue {
  units: Unit[]
  loading: boolean
  createUnit: (unit: Unit) => Promise<void>
  updateUnit: (unit: Unit) => Promise<void>
  deleteUnit: (id: string) => Promise<void>
  reload: () => Promise<void>
}

const UnitsContext = createContext<UnitsContextValue | null>(null)

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const all = await getAllUnits()
    setUnits(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const createUnit = useCallback(async (unit: Unit) => {
    await putUnit(unit)
    setUnits((prev) => [...prev.filter((u) => u.id !== unit.id), unit])
  }, [])

  const updateUnit = useCallback(async (unit: Unit) => {
    await putUnit(unit)
    setUnits((prev) => prev.map((u) => (u.id === unit.id ? unit : u)))
  }, [])

  const deleteUnit = useCallback(async (id: string) => {
    await dbDeleteUnit(id)
    setUnits((prev) => prev.filter((u) => u.id !== id))
  }, [])

  return (
    <UnitsContext.Provider value={{ units, loading, createUnit, updateUnit, deleteUnit, reload }}>
      {children}
    </UnitsContext.Provider>
  )
}

export function useUnits(): UnitsContextValue {
  const ctx = useContext(UnitsContext)
  if (!ctx) throw new Error('useUnits must be used within UnitsProvider')
  return ctx
}
