import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/adminGuard'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { error } = await adminGuard(req)
  if (error) return error

  const { id } = await params
  await connectDB()

  const user = await User.findById(id)
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  user.passwordHash = null
  user.sessionVersion = (user.sessionVersion ?? 0) + 1
  await user.save()

  return NextResponse.json({ ok: true })
}
