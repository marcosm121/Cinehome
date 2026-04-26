import { NextRequest, NextResponse } from 'next/server'
import { signToken, COOKIE_NAME, SESSION_DURATION_SECONDS } from '@/lib/auth'
import { getUserByUsername } from '@/lib/users'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { username, password } = body as Record<string, unknown>
  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const user = getUserByUsername(username)
  if (!user) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

  if (password !== user.password) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

  try {
    const token = await signToken({ userId: user.id, username: user.username, name: user.name })
    const res = NextResponse.json({ user: { id: user.id, name: user.name, username: user.username } })
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('[login] signToken failed:', err)
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }
}
