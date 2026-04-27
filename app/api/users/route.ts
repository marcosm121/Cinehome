import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/getSession'
import { getAllUsers } from '@/lib/users'

// Returns public info about all users (no passwords)
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await getAllUsers()
  return NextResponse.json({ users: users.map(u => ({ id: u._id, name: u.name, username: u.username })) })
}
