import { Skeleton } from '@/components/Skeleton'

export default function AdminLoading() {
  return (
    <div style={{ padding: '24px 22px', maxWidth: 600, margin: '0 auto' }}>
      <Skeleton width={120} height={36} borderRadius={8} style={{ marginBottom: 20 }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={64} borderRadius={12} style={{ marginBottom: 10 }} />
      ))}
    </div>
  )
}
