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
  const numericId = parseInt(id, 10)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: 'ID de película inválido' }, { status: 400 })
  }

  try {
    const data = await tmdbGet(
      `/movie/${numericId}?language=es-MX&append_to_response=credits`,
      `movie:${numericId}`
    ) as Record<string, any>
    return NextResponse.json(normalizeTmdbMovie(data))
  } catch (err) {
    console.error(`[movies/${numericId}]`, err)
    return NextResponse.json({ error: 'Error al obtener la película' }, { status: 502 })
  }
}
