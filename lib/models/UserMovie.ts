import mongoose, { Schema, Document } from 'mongoose'

export interface IUserMovie extends Document {
  userId: string
  tmdbId: number
  watched: boolean
  watchedAt: Date | null
  rating: number | null
  notes: string | null
  updatedAt: Date
}

const UserMovieSchema = new Schema<IUserMovie>({
  userId: { type: String, required: true },
  tmdbId: { type: Number, required: true },
  watched: { type: Boolean, default: false },
  watchedAt: { type: Date, default: null },
  rating: { type: Number, min: 1, max: 10, default: null },
  notes: { type: String, default: null },
  updatedAt: { type: Date, default: Date.now },
})

UserMovieSchema.index({ userId: 1, tmdbId: 1 }, { unique: true })

export default mongoose.models.UserMovie || mongoose.model<IUserMovie>('UserMovie', UserMovieSchema)
