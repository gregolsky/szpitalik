import { openDB, type IDBPDatabase } from 'idb'
import type { Unit, Plan } from '@/types'
import { SCHEMA_VERSION } from '@/types'

const DB_NAME = 'szpitalik'
const DB_VERSION = 1
const SCHEMA_KEY = 'szpitalik_schema_v'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('units')) {
          db.createObjectStore('units', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('plans')) {
          const planStore = db.createObjectStore('plans', { keyPath: 'id' })
          planStore.createIndex('by_unitId', 'unitId', { unique: false })
        }
      },
      blocked() {
        console.warn('DB upgrade blocked')
      },
      blocking() {
        dbPromise = null
      },
    }).then((db) => {
      const stored = localStorage.getItem(SCHEMA_KEY)
      if (stored === null) {
        localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION))
      } else if (parseInt(stored) !== SCHEMA_VERSION) {
        console.warn('Schema version mismatch. Stored:', stored, 'Expected:', SCHEMA_VERSION)
      }
      return db
    })
  }
  return dbPromise
}

export async function getAllUnits(): Promise<Unit[]> {
  const db = await getDb()
  return db.getAll('units') as Promise<Unit[]>
}

export async function getUnit(id: string): Promise<Unit | undefined> {
  const db = await getDb()
  return db.get('units', id) as Promise<Unit | undefined>
}

export async function putUnit(unit: Unit): Promise<void> {
  const db = await getDb()
  await db.put('units', unit)
}

export async function deleteUnit(id: string): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['units', 'plans'], 'readwrite')
  await tx.objectStore('units').delete(id)
  const idx = tx.objectStore('plans').index('by_unitId')
  const keys = await idx.getAllKeys(id)
  for (const key of keys) {
    await tx.objectStore('plans').delete(key)
  }
  await tx.done
}

export async function getPlansByUnit(unitId: string): Promise<Plan[]> {
  const db = await getDb()
  const idx = db.transaction('plans', 'readonly').store.index('by_unitId')
  return idx.getAll(unitId) as Promise<Plan[]>
}

export async function getPlan(id: string): Promise<Plan | undefined> {
  const db = await getDb()
  return db.get('plans', id) as Promise<Plan | undefined>
}

export async function putPlan(plan: Plan): Promise<void> {
  const db = await getDb()
  await db.put('plans', plan)
}

export async function deletePlan(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('plans', id)
}

export async function getAllPlans(): Promise<Plan[]> {
  const db = await getDb()
  return db.getAll('plans') as Promise<Plan[]>
}

export async function clearAll(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(['units', 'plans'], 'readwrite')
  await tx.objectStore('units').clear()
  await tx.objectStore('plans').clear()
  await tx.done
  localStorage.removeItem(SCHEMA_KEY)
}
