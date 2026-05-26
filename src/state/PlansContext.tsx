import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Plan } from '@/types'
import { getAllPlans, putPlan, deletePlan as dbDeletePlan } from '@/storage/db'

interface PlansContextValue {
  plans: Plan[]
  loading: boolean
  savePlan: (plan: Plan) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  getPlansByUnitId: (unitId: string) => Plan[]
  reload: () => Promise<void>
}

const PlansContext = createContext<PlansContextValue | null>(null)

export function PlansProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const all = await getAllPlans()
    setPlans(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const savePlan = useCallback(async (plan: Plan) => {
    await putPlan(plan)
    setPlans((prev) => [...prev.filter((p) => p.id !== plan.id), plan])
  }, [])

  const deletePlan = useCallback(async (id: string) => {
    await dbDeletePlan(id)
    setPlans((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const getPlansByUnitId = useCallback(
    (unitId: string) => plans.filter((p) => p.unitId === unitId),
    [plans],
  )

  return (
    <PlansContext.Provider value={{ plans, loading, savePlan, deletePlan, getPlansByUnitId, reload }}>
      {children}
    </PlansContext.Provider>
  )
}

export function usePlans(): PlansContextValue {
  const ctx = useContext(PlansContext)
  if (!ctx) throw new Error('usePlans must be used within PlansProvider')
  return ctx
}
