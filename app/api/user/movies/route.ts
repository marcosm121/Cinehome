import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import UserMovie from '@/lib/models/UserMovie'
import { getSession } from '@/lib/getSession'

// GET /api/user/movies?tmdbIds=123,456 or GET /api/user/movies (all)
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()
    const raw = req.nextUrl.searchParams.get('tmdbIds')
    const tmdbIds = raw
      ? raw.split(',').map(Number).filter(n => Number.isInteger(n) && n > 0)
      : []

    const entries = tmdbIds.length
      ? await UserMovie.find({ userId: session.userId, tmdbId: { $in: tmdbIds } })
      : await UserMovie.find({ userId: session.userId })

    return NextResponse.json({ entries })
  } catch (err) {
    console.error('[user/movies GET]', err)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}
