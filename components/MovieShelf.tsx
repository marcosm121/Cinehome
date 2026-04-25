'use client'
import { MovieCard } from './MovieCard'
import type { NormalizedMovie } from '@/lib/tmdb'

interface MovieShelfProps {
  movies: NormalizedMovie[]
  userStates?: Record<number, { watched: boolean; rating: number | null; notes: string | null }>
}

export function MovieShelf({ movies, userStates }: MovieShelfProps) {
  if (!movies.length) return null
  return (
    <div style={{
      display: 'flex', gap: 12, overflowX: 'auto',
      scrollbarWidth: 'none', padding: '0 22px',
      paddingBottom: 4,
    }}>
      {movies.map(m => (
        <MovieCard
          key={m.tmdbId}
          movie={m}
          userState={userStates?.[m.tmdbId] ?? null}
          variant="shelf"
        />
      ))}
    </div>
  )
}
