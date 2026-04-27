import { SignJWT, jwtVerify } from 'jose'

export const COOKIE_NAME = 'cinehome_session'
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30 // 30 days

export interface JwtPayload {
  userId: string
  username: string
  name: string
  isAdmin: boolean
  sessionVersion: number
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters')
  }
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    const { userId, username, name, isAdmin, sessionVersion } = payload as Record<string, unknown>
    if (typeof userId !== 'string' || typeof username !== 'string' || typeof name !== 'string') {
      return null
    }
    return { userId, username, name, isAdmin: !!isAdmin, sessionVersion: typeof sessionVersion === 'number' ? sessionVersion : -1 }
  } catch {
    return null
  }
}
