import { Skeleton } from '@/components/Skeleton'

export default function ListDetailLoading() {
  return (
    <div style={{ padding: '24px 22px 110px', maxWidth: 1080, margin: '0 auto' }}>
      <Skeleton width={80} height={14} borderRadius={4} style={{ marginBottom: 20 }} />
      <Skeleton width={220} height={38} borderRadius={8} style={{ marginBottom: 16 }} />
      <div style={{ display: 'flex', gap: 24, marginBottom: 28 }}>
        <Skeleton width={60} height={18} borderRadius={4} />
        <Skeleton width={80} height={18} borderRadius={4} />
        <Skeleton width={60} height={18} borderRadius={4} />
      </div>
      {/* Controls bar */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width={80} height={30} borderRadius={999} />
        ))}
      </div>
      {/* Movie grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '28px 16px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton style={{ aspectRatio: '2/3' }} borderRadius={6} />
            <Skeleton width="80%" height={13} borderRadius={4} style={{ marginTop: 10 }} />
            <Skeleton width="50%" height={11} borderRadius={4} style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
