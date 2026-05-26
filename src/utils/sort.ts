import type { Doctor, DoctorType } from '@/types'

export function sortDoctorsByLastName(doctors: Doctor[]): Doctor[] {
  return [...doctors].sort((a, b) => a.lastName.localeCompare(b.lastName, 'pl'))
}

const TYPE_ORDER: Record<DoctorType, number> = { specialist: 0, senior_resident: 1, resident: 2 }

export function sortDoctorsByTypeAndName(doctors: Doctor[]): Doctor[] {
  return [...doctors].sort((a, b) => {
    const t = TYPE_ORDER[a.type] - TYPE_ORDER[b.type]
    if (t !== 0) return t
    const ln = a.lastName.localeCompare(b.lastName, 'pl')
    if (ln !== 0) return ln
    return a.firstName.localeCompare(b.firstName, 'pl')
  })
}
