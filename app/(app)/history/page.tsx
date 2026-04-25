'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { RatingBadge } from '@/components/RatingBadge'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function HistoryPage() {
  const { data } = useSWR('/api/user/movies', fetcher)
  const allEntries = (data?.entries ?? []).filter((e: any) => e.watched)

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
        <MonthGroup key={key} monthKey={key} entries={byMonth[key]} />
      ))}
    </div>
  )
}

function MonthGroup({ monthKey, entries }: { monthKey: string; entries: any[] }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
        {formatMonth(monthKey)}{' '}
        <span style={{ color: 'var(--ink-faint)', fontWeight: 400, fontSize: 12 }}>{entries.length}</span>
      </div>
      {entries.map((e: any, i: number) => (
        <HistoryRow key={e.tmdbId} entry={e} last={i === entries.length - 1} />
      ))}
    </div>
  )
}

function HistoryRow({ entry, last }: { entry: any; last: boolean }) {
  const { data: movie } = useSWR(`/api/movies/${entry.tmdbId}`, fetcher)

  return (
    <Link href={`/movie/${entry.tmdbId}`} style={{
      display: 'flex', gap: 14, padding: '12px 0',
      borderBottom: last ? 'none' : '1px solid var(--line)',
      alignItems: 'flex-start', textDecoration: 'none',
    }}>
      <div style={{ width: 40, height: 60, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-card)' }}>
        {movie?.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={movie.posterUrl.replace('w500', 'w92')} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
          {movie?.title ?? `#${entry.tmdbId}`}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 3 }}>
          {[movie?.director, movie?.year].filter(Boolean).join(' · ')}
        </div>
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
