import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/getSession'
import { tmdbGet, normalizeTmdbMovie } from '@/lib/tmdb'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const data = await tmdbGet(
    `/movie/${id}/recommendations?language=es-MX&page=1`,
    `recs:${id}`
  )
  const results = (data.results ?? []).slice(0, 12).map(normalizeTmdbMovie)
  return NextResponse.json({ results })
}
