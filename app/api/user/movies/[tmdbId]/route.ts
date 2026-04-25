import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import UserMovie from '@/lib/models/UserMovie'
import { getSession } from '@/lib/getSession'

type Params = { params: Promise<{ tmdbId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tmdbId: tmdbIdStr } = await params
  const tmdbId = parseInt(tmdbIdStr, 10)
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: 'tmdbId inválido' }, { status: 400 })
  }

  try {
    await connectDB()
    const entry = await UserMovie.findOne({ userId: session.userId, tmdbId })
    return NextResponse.json({ entry: entry ?? null })
  } catch (err) {
    console.error('[user/movies GET single]', err)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tmdbId: tmdbIdStr } = await params
  const tmdbId = parseInt(tmdbIdStr, 10)
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return NextResponse.json({ error: 'tmdbId inválido' }, { status: 400 })
  }

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const { watched, rating, notes } = body as Record<string, unknown>
  const update: Record<string, unknown> = {}

  if (typeof watched === 'boolean') {
    update.watched = watched
    update.watchedAt = watched ? new Date() : null
  }
  if (rating === null || (typeof rating === 'number' && rating >= 1 && rating <= 10)) {
    update.rating = rating
  }
  if (typeof notes === 'string' || notes === null) {
    update.notes = notes
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 })
  }

  try {
    await connectDB()
    const entry = await UserMovie.findOneAndUpdate(
      { userId: session.userId, tmdbId },
      { $set: update },
      { upsert: true, new: true }
    )
    return NextResponse.json({ entry })
  } catch (err) {
    console.error('[user/movies PUT]', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}
