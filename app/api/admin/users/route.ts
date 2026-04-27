import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/adminGuard'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const { error } = await adminGuard(req)
  if (error) return error
  await connectDB()
  const users = await User.find({}, { passwordHash: 0 }).lean()
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const { error } = await adminGuard(req)
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { name, username } = body as Record<string, unknown>
  if (typeof name !== 'string' || !name.trim() || typeof username !== 'string' || !username.trim()) {
    return NextResponse.json({ error: 'Nombre y usuario requeridos' }, { status: 400 })
  }

  await connectDB()
  const existing = await User.findOne({ username: username.trim().toLowerCase() })
  if (existing) return NextResponse.json({ error: 'El usuario ya existe' }, { status: 409 })

  try {
    const user = await User.create({
      _id: randomUUID(),
      name: name.trim(),
      username: username.trim().toLowerCase(),
      isAdmin: false,
      passwordHash: null,
      sessionVersion: 0,
    })
    return NextResponse.json({ user: { _id: user._id, name: user.name, username: user.username } }, { status: 201 })
  } catch (err) {
    console.error('[admin/users POST]', err)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
