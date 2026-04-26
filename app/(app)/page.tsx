'use client'
import useSWR from 'swr'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MovieShelf } from '@/components/MovieShelf'
import { Skeleton } from '@/components/Skeleton'
import type { NormalizedMovie } from '@/lib/tmdb'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function HomePage() {
  const { data: trendingData } = useSWR('/api/movies/trending', fetcher)
  const { data: listsData } = useSWR('/api/lists', fetcher)
  const trending: NormalizedMovie[] = trendingData?.results ?? []
  const lists = listsData?.lists ?? []
  const hero = trending[0]

  return (
    <div style={{ paddingBottom: 90 }}>
      {hero ? <HeroBand movie={hero} /> : (
        <div style={{ height: 480, background: 'var(--bg-elevated)' }}>
          <Skeleton width="100%" height={480} borderRadius={0} />
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <TonightCard lists={lists} />
        <Section title="Tendencias esta semana">
          <MovieShelf movies={trending.slice(1, 10)} />
        </Section>
      </div>
    </div>
  )
}

function HeroBand({ movie }: { movie: NormalizedMovie }) {
  return (
    <div style={{ position: 'relative', height: 480, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
      {movie.backdropUrl && (
        <Image
          src={movie.backdropUrl}
          alt={movie.title}
          fill
          sizes="100vw"
          style={{ objectFit: 'cover', opacity: 0.45 }}
          priority
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, transparent 20%, var(--bg) 100%)',
      }} />
      <div style={{ position: 'absolute', left: 22, right: 22, bottom: 28 }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.3px' }}>
          Tendencia · {movie.year}
        </div>
        <h1 style={{
          fontSize: 34, fontWeight: 800, letterSpacing: '-1.2px',
          lineHeight: 1, color: 'var(--ink)', marginBottom: 10,
          margin: '0 0 10px',
        }}>
          {movie.title}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-dim)', marginBottom: 16, lineHeight: 1.5, margin: '0 0 16px' }}>
          {movie.overview?.slice(0, 120)}{movie.overview && movie.overview.length > 120 ? '…' : ''}
        </p>
        <Link href={`/movie/${movie.tmdbId}`} style={{
          display: 'inline-block', padding: '10px 20px', borderRadius: 'var(--radius-md)',
          background: 'var(--accent)', color: '#000',
          fontWeight: 700, fontSize: 14, textDecoration: 'none',
        }}>
          Ver detalle
        </Link>
      </div>
    </div>
  )
}

function TonightCard({ lists }: { lists: any[] }) {
  const { data } = useSWR(
    lists.length ? `/api/lists/${lists[0]._id}/movies` : null,
    fetcher
  )
  const movies: any[] = data?.movies ?? []
  const [idx, setIdx] = useState(0)

  if (!movies.length) return null
  const pick = movies[idx % movies.length]

  return (
    <div style={{
      margin: '24px 22px 0',
      padding: 16, borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-card)', border: '1px solid var(--line-strong)',
      display: 'flex', gap: 14, alignItems: 'center',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 6 }}>
          ✦ Qué ver esta noche
        </div>
        <Link href={`/movie/${pick.tmdbId}`} style={{
          fontWeight: 700, fontSize: 16, color: 'var(--ink)', textDecoration: 'none', display: 'block',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {pick.tmdbTitle ?? `Película #${pick.tmdbId}`}
        </Link>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 3 }}>{lists[0]?.name}</div>
      </div>
      <button
        onClick={() => setIdx(i => i + 1)}
        style={{
          padding: '8px 14px', borderRadius: 'var(--radius-sm)',
          background: 'transparent', border: '1px solid var(--line-strong)',
          color: 'var(--ink-mute)', cursor: 'pointer', fontSize: 12, flexShrink: 0,
        }}
      >
        Otra
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 36 }}>
      <h2 style={{
        fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px',
        color: 'var(--ink)', padding: '0 22px', marginBottom: 14, margin: '0 0 14px',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
