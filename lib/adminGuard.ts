import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './getSession'
import { JwtPayload } from './auth'

export async function adminGuard(req: NextRequest): Promise<
  { error: NextResponse; session: null } | { error: null; session: JwtPayload }
> {
  const session = await getSession(req)
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  if (!session.isAdmin) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null }
  return { error: null, session }
}
