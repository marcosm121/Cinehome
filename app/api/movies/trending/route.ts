import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/getSession'
import { tmdbGet, normalizeTmdbMovie } from '@/lib/tmdb'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await tmdbGet('/trending/movie/week?language=es-MX', 'trending:week')
  const results = (data.results ?? []).slice(0, 20).map(normalizeTmdbMovie)
  return NextResponse.json({ results })
}
