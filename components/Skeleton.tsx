export function Skeleton({ width, height, borderRadius = 6, style = {} }: {
  width?: string | number
  height?: string | number
  borderRadius?: number | string
  style?: React.CSSProperties
}) {
  return (
    <div style={{
      width, height, borderRadius,
      background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-hover) 50%, var(--bg-card) 75%)',
      backgroundSize: '400% 100%',
      animation: 'skeleton-shimmer 1.4s ease infinite',
      flexShrink: 0,
      ...style,
    }} />
  )
}

export function PosterSkeleton({ width = 128, height }: { width?: number; height?: number }) {
  const h = height ?? Math.round(width * 1.5)
  return <Skeleton width={width} height={h} borderRadius={6} />
}
