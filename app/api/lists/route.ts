import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import List from '@/lib/models/List'
import { getSession } from '@/lib/getSession'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()
    const lists = await List.find({
      $or: [{ ownerId: session.userId }, { isShared: true }],
    }).sort({ createdAt: -1 })
    return NextResponse.json({ lists })
  } catch (err) {
    console.error('[lists GET]', err)
    return NextResponse.json({ error: 'Error al obtener listas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { name, isShared } = body as Record<string, unknown>
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  }

  try {
    await connectDB()
    const list = await List.create({
      name: name.trim(),
      ownerId: session.userId,
      isShared: isShared === true,
    })
    return NextResponse.json({ list }, { status: 201 })
  } catch (err) {
    console.error('[lists POST]', err)
    return NextResponse.json({ error: 'Error al crear lista' }, { status: 500 })
  }
}
