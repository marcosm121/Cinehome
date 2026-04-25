import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import List from '@/lib/models/List'
import ListMovie from '@/lib/models/ListMovie'
import { getSession } from '@/lib/getSession'

type Params = { params: Promise<{ id: string }> }

async function getAccessibleList(req: NextRequest, id: string) {
  const session = await getSession(req)
  if (!session) return { error: 'Unauthorized', status: 401, list: null, session: null }
  await connectDB()
  const list = await List.findById(id)
  if (!list) return { error: 'Lista no encontrada', status: 404, list: null, session: null }
  if (list.ownerId !== session.userId && !list.isShared) {
    return { error: 'Forbidden', status: 403, list: null, session: null }
  }
  return { error: null, status: 200, list, session }
}

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { error, status } = await getAccessibleList(req, id)
  if (error) return NextResponse.json({ error }, { status })

  try {
    const movies = await ListMovie.find({ listId: id }).sort({ addedAt: -1 })
    return NextResponse.json({ movies })
  } catch (err) {
    console.error('[lists/movies GET]', err)
    return NextResponse.json({ error: 'Error al obtener películas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { error, status, session } = await getAccessibleList(req, id)
  if (error) return NextResponse.json({ error }, { status })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const { tmdbId, tmdbTitle, tmdbPosterUrl } = body as Record<string, unknown>
  if (typeof tmdbId !== 'number' || !Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: 'tmdbId inválido' }, { status: 400 })
  }

  try {
    const entry = await ListMovie.findOneAndUpdate(
      { listId: id, tmdbId },
      {
        addedBy: session!.userId,
        addedAt: new Date(),
        ...(typeof tmdbTitle === 'string' && { tmdbTitle }),
        ...(typeof tmdbPosterUrl === 'string' && { tmdbPosterUrl }),
      },
      { upsert: true, new: true }
    )
    return NextResponse.json({ entry }, { status: 201 })
  } catch (err) {
    console.error('[lists/movies POST]', err)
    return NextResponse.json({ error: 'Error al agregar película' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { error, status } = await getAccessibleList(req, id)
  if (error) return NextResponse.json({ error }, { status })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const { tmdbId } = body as Record<string, unknown>
  if (typeof tmdbId !== 'number') {
    return NextResponse.json({ error: 'tmdbId requerido' }, { status: 400 })
  }

  try {
    await ListMovie.deleteOne({ listId: id, tmdbId })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[lists/movies DELETE]', err)
    return NextResponse.json({ error: 'Error al eliminar película' }, { status: 500 })
  }
}
