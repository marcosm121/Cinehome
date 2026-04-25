import { SignJWT, jwtVerify } from 'jose'

const secret = process.env.JWT_SECRET
if (!secret || secret.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters')
}
const SECRET = new TextEncoder().encode(secret)

export const COOKIE_NAME = 'cinehome_session'
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30 // 30 days

export interface JwtPayload {
  userId: string
  username: string
  name: string
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    const { userId, username, name } = payload as Record<string, unknown>
    if (typeof userId !== 'string' || typeof username !== 'string' || typeof name !== 'string') {
      return null
    }
    return { userId, username, name }
  } catch {
    return null
  }
}
