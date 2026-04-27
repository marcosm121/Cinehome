import { NextRequest, NextResponse } from 'next/server'
import { adminGuard } from '@/lib/adminGuard'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import List from '@/lib/models/List'
import ListMovie from '@/lib/models/ListMovie'
import UserMovie from '@/lib/models/UserMovie'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, { params }: Params) {
  const { error, session } = await adminGuard(req)
  if (error) return error

  const { id } = await params
  if (id === session!.userId) {
    return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 })
  }

  await connectDB()
  const user = await User.findById(id)
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  try {
    const userLists = await List.find({ ownerId: id }, { _id: 1 })
    const listIds = userLists.map(l => l._id)
    await ListMovie.deleteMany({ listId: { $in: listIds } })
    await List.deleteMany({ ownerId: id })
    await UserMovie.deleteMany({ userId: id })
    await List.updateMany({ sharedWith: id }, { $pull: { sharedWith: id } })
    await User.findByIdAndDelete(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/users DELETE]', err)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
