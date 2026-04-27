import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
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

  const user = await getUserByUsername(username)
  if (!user) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

  // First login: no password set yet — issue a temp token for set-password flow
  if (!user.passwordHash) {
    const tempToken = await signToken({
      userId: user._id as string,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin,
      sessionVersion: -1, // special value: not a real session
    })
    return NextResponse.json({ requiresPasswordSetup: true, tempToken })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })

  try {
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
  } catch (err) {
    console.error('[login] signToken failed:', err)
    return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
  }
}
