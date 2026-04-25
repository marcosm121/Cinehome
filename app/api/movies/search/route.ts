import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/getSession'
import { tmdbGet, normalizeTmdbMovie } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ results: [] })

  try {
    const cacheKey = `search:${encodeURIComponent(q.toLowerCase().trim())}`
    const data = await tmdbGet(
      `/search/movie?query=${encodeURIComponent(q)}&language=es-MX&page=1`,
      cacheKey
    ) as Record<string, any>
    const results = (data.results ?? []).slice(0, 20).map(normalizeTmdbMovie)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('[movies/search]', err)
    return NextResponse.json({ error: 'Error al buscar películas' }, { status: 502 })
  }
}
