import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/getSession'
import { tmdbGet, normalizeTmdbMovie } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ results: [] })

  const slug = q.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 60)
  const cacheKey = `search:${slug}`
  const data = await tmdbGet(
    `/search/movie?query=${encodeURIComponent(q)}&language=es-MX&page=1`,
    cacheKey
  )
  const results = (data.results ?? []).slice(0, 20).map(normalizeTmdbMovie)
  return NextResponse.json({ results })
}
