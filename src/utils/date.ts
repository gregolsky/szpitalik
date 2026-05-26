export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function formatDate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

export function generateSlots(year: number, month: number, wardIds: string[]): Array<{ date: string; wardId: string }> {
  const days = daysInMonth(year, month)
  const slots: Array<{ date: string; wardId: string }> = []
  for (let d = 1; d <= days; d++) {
    const date = formatDate(year, month, d)
    for (const wardId of wardIds) {
      slots.push({ date, wardId })
    }
  }
  return slots
}

export function monthLabel(year: number, month: number): string {
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' })
}
