import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/getSession'
import { tmdbGet, normalizeTmdbMovie } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const genres = searchParams.get('genres') ?? ''
  const year = searchParams.get('year') ?? ''
  const minRating = searchParams.get('minRating') ?? ''
  const sort = searchParams.get('sort') ?? 'popularity.desc'
  const page = searchParams.get('page') ?? '1'

  const params = new URLSearchParams({
    language: 'es-MX',
    sort_by: sort,
    page,
    include_adult: 'false',
  })
  if (genres) params.set('with_genres', genres)
  if (year) params.set('primary_release_year', year)
  if (minRating) params.set('vote_average.gte', minRating)
  if (minRating) params.set('vote_count.gte', '100')

  const cacheKey = `discover:${params.toString()}`

  try {
    const data = await tmdbGet(`/discover/movie?${params.toString()}`, cacheKey) as Record<string, any>
    const results = (data.results ?? []).map(normalizeTmdbMovie)
    return NextResponse.json({
      results,
      page: data.page ?? 1,
      totalPages: Math.min(data.total_pages ?? 1, 20),
    })
  } catch (err) {
    console.error('[movies/discover]', err)
    return NextResponse.json({ error: 'Error al explorar películas' }, { status: 502 })
  }
}
