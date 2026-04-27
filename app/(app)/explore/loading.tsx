import { Skeleton } from '@/components/Skeleton'

export default function ExploreLoading() {
  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: '20px 22px 0' }}>
        <Skeleton width={160} height={32} borderRadius={8} />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '16px 22px 4px', overflow: 'hidden' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width={80} height={34} borderRadius={8} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '12px 22px 0' }}>
        <Skeleton width="50%" height={40} borderRadius={8} />
        <Skeleton width="50%" height={40} borderRadius={8} />
      </div>
      <div style={{ marginTop: 32, padding: '0 22px' }}>
        <Skeleton width={160} height={22} borderRadius={6} />
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width={128} height={192} borderRadius={8} />
          ))}
        </div>
      </div>
    </div>
  )
}
