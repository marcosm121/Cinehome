import { connectDB } from './db'
import TmdbCache from './models/TmdbCache'

const BASE = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p'
const TOKEN = process.env.TMDB_READ_TOKEN!
const CACHE_TTL_MS = 1000 * 60 * 60 * 6 // 6 hours
const FETCH_TIMEOUT_MS = 8000

// Static genre map to resolve genre_ids from list endpoints
const GENRE_MAP: Record<number, string> = {
  28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia',
  80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familia',
  14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
  9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia Ficción',
  10770: 'Película de TV', 53: 'Thriller', 10752: 'Bélica', 37: 'Western',
}

async function tmdbFetch(path: string): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      signal: controller.signal,
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`TMDB error: ${res.status} ${path}`)
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

export async function tmdbGet(path: string, cacheKey: string): Promise<unknown> {
  await connectDB()
  const cached = await TmdbCache.findById(cacheKey)
  if (cached && cached.expiresAt > new Date()) return cached.data

  const data = await tmdbFetch(path)
  await TmdbCache.findByIdAndUpdate(
    cacheKey,
    { data, expiresAt: new Date(Date.now() + CACHE_TTL_MS) },
    { upsert: true }
  )
  return data
}

export function posterUrl(path: string | null, size = 'w500'): string | null {
  if (!path) return null
  return `${IMG_BASE}/${size}${path}`
}

export interface NormalizedMovie {
  tmdbId: number
  title: string
  overview: string | null
  year: number | null
  runtime: number | null
  genres: string[]
  posterUrl: string | null
  backdropUrl: string | null
  voteAverage: number | null
  language: string | null
  country: string | null
  director: string | null
  cast: string[]
  tagline: string | null
}

export function normalizeTmdbMovie(raw: Record<string, any>): NormalizedMovie {
  // List endpoints return genre_ids (numbers), detail endpoint returns genres (objects)
  let genres: string[] = []
  if (Array.isArray(raw.genres) && raw.genres.length > 0) {
    genres = raw.genres.map((g: { name: string }) => g.name)
  } else if (Array.isArray(raw.genre_ids)) {
    genres = raw.genre_ids.map((id: number) => GENRE_MAP[id]).filter(Boolean)
  }

  return {
    tmdbId: raw.id,
    title: raw.title,
    overview: raw.overview || null,
    year: raw.release_date ? parseInt(raw.release_date.slice(0, 4), 10) : null,
    runtime: raw.runtime ?? null,
    genres,
    posterUrl: posterUrl(raw.poster_path ?? null),
    backdropUrl: posterUrl(raw.backdrop_path ?? null, 'w1280'),
    voteAverage: raw.vote_average != null && raw.vote_average > 0
      ? Math.round(raw.vote_average * 10) / 10
      : null,
    language: raw.original_language ?? null,
    country: raw.production_countries?.[0]?.name ?? null,
    director: raw.credits?.crew?.find((c: { job: string; name: string }) => c.job === 'Director')?.name ?? null,
    cast: (raw.credits?.cast ?? []).slice(0, 8).map((c: { name: string }) => c.name),
    tagline: raw.tagline || null,
  }
}
