import type { Doctor } from '@/types'

export function sortDoctorsByLastName(doctors: Doctor[]): Doctor[] {
  return [...doctors].sort((a, b) => a.lastName.localeCompare(b.lastName, 'pl'))
}
