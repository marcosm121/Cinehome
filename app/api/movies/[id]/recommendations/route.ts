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
      `/movie/${numericId}/recommendations?language=es-MX&page=1`,
      `recs:${numericId}`
    ) as Record<string, any>
    const results = (data.results ?? []).slice(0, 12).map(normalizeTmdbMovie)
    return NextResponse.json({ results })
  } catch (err) {
    console.error(`[movies/${numericId}/recommendations]`, err)
    return NextResponse.json({ error: 'Error al obtener recomendaciones' }, { status: 502 })
  }
}
