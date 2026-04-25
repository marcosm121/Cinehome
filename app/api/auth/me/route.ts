import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/getSession'
import { getUserById } from '@/lib/users'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = getUserById(session.userId)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ id: user.id, name: user.name, username: user.username })
}
