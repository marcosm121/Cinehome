import { Skeleton } from '@/components/Skeleton'

export default function WatchlistLoading() {
  return (
    <div style={{ padding: '24px 22px 110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Skeleton width={140} height={38} borderRadius={8} />
        <Skeleton width={80} height={34} borderRadius={10} />
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16,
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} style={{ aspectRatio: '3/4' }} borderRadius={14} />
        ))}
      </div>
    </div>
  )
}
