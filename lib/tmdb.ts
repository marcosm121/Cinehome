import { connectDB } from './db'
import TmdbCache from './models/TmdbCache'

const BASE = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p'
const TOKEN = process.env.TMDB_READ_TOKEN!
const CACHE_TTL_MS = 1000 * 60 * 60 * 6 // 6 hours

async function tmdbFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`TMDB error: ${res.status} ${path}`)
  return res.json()
}

export async function tmdbGet(path: string, cacheKey: string) {
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
  return {
    tmdbId: raw.id,
    title: raw.title,
    overview: raw.overview || null,
    year: raw.release_date ? parseInt(raw.release_date.slice(0, 4), 10) : null,
    runtime: raw.runtime ?? null,
    genres: (raw.genres ?? []).map((g: { name: string }) => g.name),
    posterUrl: posterUrl(raw.poster_path ?? null),
    backdropUrl: posterUrl(raw.backdrop_path ?? null, 'w1280'),
    voteAverage: raw.vote_average ? Math.round(raw.vote_average * 10) / 10 : null,
    language: raw.original_language ?? null,
    country: raw.production_countries?.[0]?.name ?? null,
    director: raw.credits?.crew?.find((c: { job: string; name: string }) => c.job === 'Director')?.name ?? null,
    cast: (raw.credits?.cast ?? []).slice(0, 8).map((c: { name: string }) => c.name),
    tagline: raw.tagline || null,
  }
}
