import { NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME, JwtPayload } from './auth'

export async function getSession(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}
