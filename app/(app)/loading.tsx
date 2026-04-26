import { Skeleton } from '@/components/Skeleton'

// Global fallback — shown during any navigation in the (app) group
export default function Loading() {
  return (
    <div style={{ padding: '24px 22px' }}>
      <Skeleton height={36} width={180} borderRadius={8} style={{ marginBottom: 24 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={60} borderRadius={12} />
        ))}
      </div>
    </div>
  )
}
