import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/getSession'
import { tmdbGet } from '@/lib/tmdb'
import { getJustWatchAvailability } from '@/lib/justwatch'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const tmdbId = parseInt(id, 10)
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: 'ID de película inválido' }, { status: 400 })
  }

  try {
    const movie = await tmdbGet(
      `/movie/${tmdbId}?language=es-MX&append_to_response=credits`,
      `movie:${tmdbId}`
    ) as Record<string, unknown>

    const availability = await getJustWatchAvailability({
      tmdbId,
      title: typeof movie.title === 'string' ? movie.title : '',
      originalTitle: typeof movie.original_title === 'string' ? movie.original_title : null,
      year: typeof movie.release_date === 'string'
        ? Number.parseInt(movie.release_date.slice(0, 4), 10) || null
        : null,
    })

    return NextResponse.json({ availability })
  } catch (err) {
    console.error(`[movies/${tmdbId}/watch]`, err)
    return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: 502 })
  }
}
