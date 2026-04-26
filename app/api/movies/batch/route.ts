import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/getSession'
import { connectDB } from '@/lib/db'
import TmdbCache from '@/lib/models/TmdbCache'
import { tmdbGet, normalizeTmdbMovie } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = req.nextUrl.searchParams.get('ids')
  if (!raw) return NextResponse.json({ movies: [] })

  const ids = raw.split(',').map(Number).filter(n => Number.isInteger(n) && n > 0)
  if (!ids.length) return NextResponse.json({ movies: [] })

  try {
    await connectDB()

    // Single MongoDB query for all cached movies
    const cacheKeys = ids.map(id => `movie:${id}`)
    const cached = await TmdbCache.find({
      _id: { $in: cacheKeys },
      expiresAt: { $gt: new Date() },
    })

    const cachedMap = new Map(cached.map(c => [c._id as string, c.data]))
    const missing = ids.filter(id => !cachedMap.has(`movie:${id}`))

    // Fetch missing from TMDB in parallel
    const fetched = await Promise.allSettled(
      missing.map(id =>
        tmdbGet(`/movie/${id}?language=es-MX&append_to_response=credits`, `movie:${id}`)
      )
    )

    const results: any[] = []
    for (const id of ids) {
      const cacheData = cachedMap.get(`movie:${id}`)
      if (cacheData) {
        results.push(normalizeTmdbMovie(cacheData as Record<string, any>))
      } else {
        const idx = missing.indexOf(id)
        const result = fetched[idx]
        if (result?.status === 'fulfilled') {
          results.push(normalizeTmdbMovie(result.value as Record<string, any>))
        }
      }
    }

    return NextResponse.json({ movies: results })
  } catch (err) {
    console.error('[movies/batch]', err)
    return NextResponse.json({ error: 'Error al obtener películas' }, { status: 502 })
  }
}
