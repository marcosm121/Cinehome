import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyToken, signToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { tempToken, password } = body as Record<string, unknown>
  if (typeof tempToken !== 'string' || typeof password !== 'string' || password.length < 6) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Verify the temp token (sessionVersion === -1 means it's a set-password token)
  const payload = await verifyToken(tempToken)
  if (!payload || payload.sessionVersion !== -1) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  await connectDB()
  const user = await User.findById(payload.userId)
  if (!user || user.passwordHash !== null) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  user.passwordHash = passwordHash
  user.sessionVersion = 1
  await user.save()

  const token = await signToken({
    userId: user._id as string,
    username: user.username,
    name: user.name,
    isAdmin: user.isAdmin,
    sessionVersion: user.sessionVersion,
  })

  const res = NextResponse.json({
    user: { id: user._id, name: user.name, username: user.username, isAdmin: user.isAdmin },
  })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  })
  return res
}
