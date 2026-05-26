interface MonthPickerProps {
  year: number
  month: number
  onChange: (year: number, month: number) => void
}

export function MonthPicker({ year, month, onChange }: MonthPickerProps) {
  const months = [
    'Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec',
    'Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień',
  ]

  return (
    <div className="month-picker">
      <button
        className="btn btn-icon"
        onClick={() => {
          if (month === 1) onChange(year - 1, 12)
          else onChange(year, month - 1)
        }}
        aria-label="Poprzedni miesiąc"
      >
        ‹
      </button>
      <span className="month-label">
        {months[month - 1]} {year}
      </span>
      <button
        className="btn btn-icon"
        onClick={() => {
          if (month === 12) onChange(year + 1, 1)
          else onChange(year, month + 1)
        }}
        aria-label="Następny miesiąc"
      >
        ›
      </button>
    </div>
  )
}
