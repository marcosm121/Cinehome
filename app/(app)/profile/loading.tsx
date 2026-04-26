import { Skeleton } from '@/components/Skeleton'

export default function ProfileLoading() {
  return (
    <div style={{ padding: '24px 22px 110px' }}>
      <div style={{ marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton width={64} height={64} borderRadius={999} />
        <Skeleton width={160} height={30} borderRadius={8} />
        <Skeleton width={100} height={14} borderRadius={4} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={72} borderRadius={0} />
        ))}
      </div>
      <Skeleton height={100} borderRadius={14} />
    </div>
  )
}
