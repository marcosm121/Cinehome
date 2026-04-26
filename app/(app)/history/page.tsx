'use client'
import useSWR from 'swr'
import { NavLink as Link } from '@/components/NavLink'
import { RatingBadge } from '@/components/RatingBadge'
import { Skeleton } from '@/components/Skeleton'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function HistoryPage() {
  const { data, isLoading } = useSWR('/api/user/movies', fetcher)
  const allEntries = (data?.entries ?? []).filter((e: any) => e.watched)

  const tmdbIds = allEntries.map((e: any) => e.tmdbId)
  const { data: batchData } = useSWR(
    tmdbIds.length ? `/api/movies/batch?ids=${tmdbIds.join(',')}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )
  const movieMap: Record<number, any> = {}
  for (const m of batchData?.movies ?? []) movieMap[m.tmdbId] = m

  if (isLoading) return (
    <div style={{ padding: '24px 22px 110px' }}>
      <Skeleton width={100} height={36} borderRadius={8} style={{ marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
        <Skeleton height={72} borderRadius={0} /><Skeleton height={72} borderRadius={0} />
      </div>
      {Array.from({ length: 6 }).map((_, i) => <SkeletonHistoryRow key={i} />)}
    </div>
  )

  const rated = allEntries.filter((e: any) => e.rating != null)
  const avg = rated.length
    ? (rated.reduce((s: number, e: any) => s + e.rating, 0) / rated.length).toFixed(1)
    : '—'

  // Group by month
  const byMonth: Record<string, any[]> = {}
  for (const e of allEntries) {
    const key = e.watchedAt ? String(e.watchedAt).slice(0, 7) : 'sin-fecha'
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(e)
  }
  const months = Object.keys(byMonth).sort().reverse()

  return (
    <div style={{ padding: '24px 22px 110px' }}>
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--ink)', margin: '0 0 20px' }}>
        Vistas
      </h1>

      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
        background: 'var(--line)', borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', marginBottom: 28,
      }}>
        <StatBox n={allEntries.length} label="películas" />
        <StatBox n={avg} label="rating promedio" accent />
      </div>

      {!months.length && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-faint)', fontSize: 14 }}>
          Todavía no marcaste películas como vistas.
        </div>
      )}

      {months.map(key => (
        <MonthGroup key={key} monthKey={key} entries={byMonth[key]} movieMap={movieMap} />
      ))}
    </div>
  )
}

function SkeletonHistoryRow() {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--line)', alignItems: 'center' }}>
      <Skeleton width={40} height={60} borderRadius={4} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton width="60%" height={14} borderRadius={4} />
        <Skeleton width="40%" height={11} borderRadius={4} />
      </div>
    </div>
  )
}

function MonthGroup({ monthKey, entries, movieMap }: { monthKey: string; entries: any[]; movieMap: Record<number, any> }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
        {formatMonth(monthKey)}{' '}
        <span style={{ color: 'var(--ink-faint)', fontWeight: 400, fontSize: 12 }}>{entries.length}</span>
      </div>
      {entries.map((e: any, i: number) => (
        <HistoryRow key={e.tmdbId} entry={e} movie={movieMap[e.tmdbId] ?? null} last={i === entries.length - 1} />
      ))}
    </div>
  )
}

function HistoryRow({ entry, movie, last }: { entry: any; movie: any; last: boolean }) {
  return (
    <Link href={`/movie/${entry.tmdbId}`} style={{
      display: 'flex', gap: 14, padding: '12px 0',
      borderBottom: last ? 'none' : '1px solid var(--line)',
      alignItems: 'flex-start', textDecoration: 'none',
    }}>
      <div style={{ width: 40, height: 60, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-card)' }}>
        {movie?.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={movie.posterUrl.replace('w500', 'w92')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Skeleton width={40} height={60} borderRadius={4} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {movie ? (
          <>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{movie.title}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 3 }}>
              {[movie.director, movie.year].filter(Boolean).join(' · ')}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
            <Skeleton width="65%" height={14} borderRadius={4} />
            <Skeleton width="40%" height={11} borderRadius={4} />
          </div>
        )}
        {entry.notes && (
          <div style={{
            marginTop: 8, padding: '7px 10px',
            background: 'var(--bg-card)', borderRadius: 6,
            borderLeft: '2px solid var(--accent)',
            fontSize: 12, color: 'var(--ink-dim)', fontStyle: 'italic', lineHeight: 1.4,
          }}>
            {entry.notes}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        {entry.rating != null
          ? <RatingBadge value={entry.rating} size={12} />
          : <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontStyle: 'italic' }}>sin calificar</span>
        }
        {entry.watchedAt && (
          <div style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 4 }}>
            {String(entry.watchedAt).slice(0, 10)}
          </div>
        )}
      </div>
    </Link>
  )
}

function StatBox({ n, label, accent }: { n: string | number; label: string; accent?: boolean }) {
  return (
    <div style={{ padding: 18, background: 'var(--bg-card)' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--ink)', letterSpacing: '-0.8px' }}>{n}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function formatMonth(key: string) {
  if (key === 'sin-fecha') return 'Sin fecha'
  const [y, m] = key.split('-')
  const names = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${names[parseInt(m, 10) - 1]} ${y}`
}
