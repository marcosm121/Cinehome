'use client'
import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { MovieShelf } from '@/components/MovieShelf'
import { MovieCard } from '@/components/MovieCard'
import { GENRE_MAP } from '@/lib/tmdb'
import type { NormalizedMovie } from '@/lib/tmdb'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => CURRENT_YEAR - i)

const RATING_OPTIONS = [
  { label: 'Cualquier rating', value: '' },
  { label: '6+ ★', value: '6' },
  { label: '7+ ★', value: '7' },
  { label: '7.5+ ★', value: '7.5' },
  { label: '8+ ★', value: '8' },
]

const GENRES = Object.entries(GENRE_MAP).map(([id, name]) => ({ id: Number(id), name }))

export default function ExplorePage() {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [year, setYear] = useState('')
  const [minRating, setMinRating] = useState('')
  const [results, setResults] = useState<NormalizedMovie[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const hasActiveFilters = selectedGenres.length > 0 || year !== '' || minRating !== ''
  const showCurated = !hasActiveFilters || (hasActiveFilters && results.length === 0 && !isLoadingMore)

  const popularUrl = '/api/movies/discover?sort=popularity.desc&page=1'
  const topRatedUrl = '/api/movies/discover?sort=vote_average.desc&minRating=7&page=1'
  const { data: popularData } = useSWR(popularUrl, fetcher)
  const { data: topRatedData } = useSWR(topRatedUrl, fetcher)
  const popular: NormalizedMovie[] = popularData?.results ?? []
  const topRated: NormalizedMovie[] = topRatedData?.results ?? []

  const fetchFiltered = useCallback(async (pageNum: number, append: boolean) => {
    const params = new URLSearchParams({ page: String(pageNum) })
    if (selectedGenres.length) params.set('genres', selectedGenres.join(','))
    if (year) params.set('year', year)
    if (minRating) params.set('minRating', minRating)

    const res = await fetch(`/api/movies/discover?${params.toString()}`)
    const data = await res.json()
    setResults(prev => append ? [...prev, ...(data.results ?? [])] : (data.results ?? []))
    setPage(data.page ?? 1)
    setTotalPages(data.totalPages ?? 1)
  }, [selectedGenres, year, minRating])

  function toggleGenre(id: number) {
    setSelectedGenres(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    )
  }

  function applyFilters() {
    setResults([])
    setPage(1)
    fetchFiltered(1, false)
  }

  async function loadMore() {
    setIsLoadingMore(true)
    await fetchFiltered(page + 1, true)
    setIsLoadingMore(false)
  }

  function clearFilters() {
    setSelectedGenres([])
    setYear('')
    setMinRating('')
    setResults([])
    setPage(1)
  }

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: '20px 22px 0' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--ink)', margin: '0 0 16px' }}>
          Explorar
        </h1>
      </div>

      {/* Chips de géneros */}
      <div style={{
        overflowX: 'auto', display: 'flex', gap: 8,
        padding: '0 22px 4px', WebkitOverflowScrolling: 'touch' as any,
        scrollbarWidth: 'none' as any,
      }}>
        {GENRES.map(g => {
          const active = selectedGenres.includes(g.id)
          return (
            <button
              key={g.id}
              onClick={() => toggleGenre(g.id)}
              style={{
                flexShrink: 0, padding: '7px 14px',
                borderRadius: 'var(--radius-md)',
                border: active ? 'none' : '1px solid var(--line-strong)',
                background: active ? 'var(--accent)' : 'var(--bg-card)',
                color: active ? '#000' : 'var(--ink-mute)',
                fontSize: 13, fontWeight: active ? 700 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {g.name}
            </button>
          )
        })}
      </div>

      {/* Fila de selectores: Año + Rating */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 22px 0' }}>
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          style={selectStyle}
        >
          <option value="">Cualquier año</option>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={minRating}
          onChange={e => setMinRating(e.target.value)}
          style={selectStyle}
        >
          {RATING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Botones buscar / limpiar */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 22px 0' }}>
        <button
          onClick={applyFilters}
          style={{
            flex: 1, padding: '10px 0',
            background: 'var(--accent)', border: 'none',
            borderRadius: 'var(--radius-md)',
            color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Buscar
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: '10px 18px',
              background: 'var(--bg-card)', border: '1px solid var(--line-strong)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--ink-mute)', fontSize: 13, cursor: 'pointer',
            }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Contenido principal */}
      <div style={{ marginTop: 24 }}>
        {showCurated ? (
          <>
            <Section title="Populares ahora">
              <MovieShelf movies={popular} />
            </Section>
            <Section title="Mejor valoradas">
              <MovieShelf movies={topRated} />
            </Section>
          </>
        ) : (
          <div style={{ padding: '0 22px' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 16 }}>
              Página {page} de {totalPages}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
            }}>
              {results.map(movie => (
                <MovieCard key={movie.tmdbId} movie={movie} variant="grid" />
              ))}
            </div>
            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                style={{
                  width: '100%', marginTop: 24,
                  padding: '12px 0',
                  background: 'var(--bg-card)', border: '1px solid var(--line-strong)',
                  borderRadius: 'var(--radius-md)',
                  color: isLoadingMore ? 'var(--ink-mute)' : 'var(--ink)',
                  fontSize: 14, fontWeight: 600, cursor: isLoadingMore ? 'default' : 'pointer',
                }}
              >
                {isLoadingMore ? 'Cargando…' : 'Cargar más'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  flex: 1, padding: '9px 12px',
  background: 'var(--bg-card)', border: '1px solid var(--line-strong)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--ink)', fontSize: 13, cursor: 'pointer',
  appearance: 'none', WebkitAppearance: 'none',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{
        fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px',
        color: 'var(--ink)', padding: '0 22px', margin: '0 0 14px',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
