import type { GAProgress } from '@/hooks/useGA'

interface ProgressBarProps {
  progress: GAProgress | null
  maxGenerations?: number
  onCancel?: () => void
}

export function ProgressBar({ progress, maxGenerations = 500, onCancel }: ProgressBarProps) {
  if (!progress) return null
  const pct = Math.min(100, Math.round((progress.generation / maxGenerations) * 100))

  return (
    <div className="progress-bar-container">
      <div className="progress-bar" style={{ width: `${pct}%` }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} />
      <span className="progress-label">
        Gen. {progress.generation} / {maxGenerations} — fitness: {progress.bestFitness}
      </span>
      {onCancel && (
        <button className="btn btn-sm btn-secondary" onClick={onCancel}>Anuluj</button>
      )}
    </div>
  )
}
