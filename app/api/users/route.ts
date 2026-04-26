import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/getSession'
import { getUsers } from '@/lib/users'

// Returns public info about all users (no passwords)
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = getUsers().map(u => ({ id: u.id, name: u.name, username: u.username }))
  return NextResponse.json({ users })
}
