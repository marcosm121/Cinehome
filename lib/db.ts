import mongoose from 'mongoose'

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined
}

const cached = global.__mongoose ?? (global.__mongoose = { conn: null, promise: null })

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined')

  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .catch((err) => {
        cached.promise = null
        throw err
      })
  }
  cached.conn = await cached.promise
  return cached.conn
}
