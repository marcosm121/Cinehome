import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import List from '@/lib/models/List'
import ListMovie from '@/lib/models/ListMovie'
import { getSession } from '@/lib/getSession'

type Params = { params: Promise<{ id: string }> }

async function getOwnedList(req: NextRequest, id: string) {
  const session = await getSession(req)
  if (!session) return { error: 'Unauthorized', status: 401, list: null, session: null }
  await connectDB()
  const list = await List.findById(id)
  if (!list) return { error: 'Lista no encontrada', status: 404, list: null, session: null }
  if (list.ownerId !== session.userId) return { error: 'Forbidden', status: 403, list: null, session: null }
  return { error: null, status: 200, list, session }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { error, status, list } = await getOwnedList(req, id)
  if (error) return NextResponse.json({ error }, { status })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }) }

  const { name, isShared } = body as Record<string, unknown>
  try {
    if (typeof name === 'string' && name.trim()) list!.name = name.trim()
    if (typeof isShared === 'boolean') list!.isShared = isShared
    await list!.save()
    return NextResponse.json({ list })
  } catch (err) {
    console.error('[lists PUT]', err)
    return NextResponse.json({ error: 'Error al actualizar lista' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { error, status } = await getOwnedList(req, id)
  if (error) return NextResponse.json({ error }, { status })

  try {
    await List.findByIdAndDelete(id)
    await ListMovie.deleteMany({ listId: id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[lists DELETE]', err)
    return NextResponse.json({ error: 'Error al eliminar lista' }, { status: 500 })
  }
}
