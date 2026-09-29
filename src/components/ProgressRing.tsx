interface ProgressRingProps {
  points: number
  goal: number
}

export function ProgressRing({ points, goal }: ProgressRingProps) {
  const safeGoal = Math.max(goal, 1)
  const percentage = Math.min(100, Math.round((points / safeGoal) * 100))
  return (
    <div
      className="progress-ring"
      style={{ '--progress': `${percentage * 3.6}deg` } as React.CSSProperties}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.min(points, goal)}
      aria-label={`${points} von ${goal} Punkten`}
    >
      <div className="progress-ring__inner">
        <strong>{Math.min(points, goal)}</strong>
        <span>von {goal}</span>
        <small>Punkten</small>
      </div>
    </div>
  )
}
