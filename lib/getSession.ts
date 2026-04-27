import { NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME, JwtPayload } from './auth'
import { connectDB } from './db'
import User from './models/User'

export async function getSession(req: NextRequest): Promise<JwtPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null

  // Verify sessionVersion — invalidates sessions after password reset or deletion
  await connectDB()
  const user = await User.findById(payload.userId).lean() as any
  if (!user || user.sessionVersion !== payload.sessionVersion) return null

  return payload
}
