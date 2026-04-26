import { Skeleton } from '@/components/Skeleton'

export default function HistoryLoading() {
  return (
    <div style={{ padding: '24px 22px 110px' }}>
      <Skeleton width={100} height={38} borderRadius={8} style={{ marginBottom: 20 }} />
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
        <Skeleton height={72} borderRadius={0} />
        <Skeleton height={72} borderRadius={0} />
      </div>
      {/* Rows */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
          <Skeleton width={40} height={60} borderRadius={4} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width="65%" height={14} borderRadius={4} />
            <Skeleton width="40%" height={11} borderRadius={4} />
          </div>
        </div>
      ))}
    </div>
  )
}
