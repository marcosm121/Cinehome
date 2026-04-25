interface RatingBadgeProps {
  value: number | null
  size?: number
  muted?: boolean
}

export function RatingBadge({ value, size = 13, muted = false }: RatingBadgeProps) {
  if (value == null) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: size, fontWeight: 600,
      color: muted ? 'var(--ink-dim)' : 'var(--ink)',
    }}>
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
        <path
          d="M10 1 L12.5 7 L19 7.5 L14 12 L15.5 18.5 L10 15 L4.5 18.5 L6 12 L1 7.5 L7.5 7 Z"
          fill="var(--gold)"
        />
      </svg>
      {Number.isInteger(value) ? value : value.toFixed(1)}
      <span style={{ color: 'var(--ink-mute)', fontWeight: 400, fontSize: size - 1 }}>/10</span>
    </span>
  )
}
