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
    `/movie/${id}?language=es-MX&append_to_response=credits`,
    `movie:${id}`
  )
  return NextResponse.json(normalizeTmdbMovie(data))
}
