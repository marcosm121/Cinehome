import mongoose from 'mongoose'
import { connectDB } from '@/lib/db'
import UserMovie from '@/lib/models/UserMovie'

describe('UserMovie model', () => {
  beforeAll(async () => { await connectDB() })

  it('creates and retrieves a user movie entry', async () => {
    const entry = await UserMovie.create({
      userId: 'test-user',
      tmdbId: 999999,
      watched: false,
    })
    expect(entry.userId).toBe('test-user')
    expect(entry.rating).toBeNull()
    await UserMovie.deleteOne({ _id: entry._id })
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })
})
