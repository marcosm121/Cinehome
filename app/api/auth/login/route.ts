import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signToken, COOKIE_NAME } from '@/lib/auth'
import { getUserByUsername } from '@/lib/users'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  const user = getUserByUsername(username)
  if (!user) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

  const token = await signToken({ userId: user.id, username: user.username, name: user.name })
  const res = NextResponse.json({ user: { id: user.id, name: user.name, username: user.username } })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
