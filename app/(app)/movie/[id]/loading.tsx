import { Skeleton } from '@/components/Skeleton'

export default function MovieDetailLoading() {
  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Hero */}
      <Skeleton width="100%" height={460} borderRadius={0} />
      {/* Actions */}
      <div style={{ padding: '16px 22px', display: 'flex', gap: 10 }}>
        <Skeleton width={140} height={36} borderRadius={10} />
        <Skeleton width={140} height={36} borderRadius={10} />
      </div>
      {/* Rating card */}
      <div style={{ margin: '0 22px 24px' }}>
        <Skeleton height={110} borderRadius={14} />
      </div>
      {/* Tabs */}
      <div style={{ padding: '0 22px' }}>
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--line)', marginBottom: 20, paddingBottom: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} width={70} height={13} borderRadius={4} />
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton width="100%" height={14} borderRadius={4} />
          <Skeleton width="90%" height={14} borderRadius={4} />
          <Skeleton width="80%" height={14} borderRadius={4} />
          <Skeleton width="60%" height={14} borderRadius={4} />
        </div>
      </div>
    </div>
  )
}
