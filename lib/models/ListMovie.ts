import mongoose, { Schema, Document, Types } from 'mongoose'

export interface IListMovie extends Document {
  listId: Types.ObjectId
  tmdbId: number
  addedBy: string
  addedAt: Date
  tmdbTitle: string | null
  tmdbPosterUrl: string | null
}

const ListMovieSchema = new Schema<IListMovie>({
  listId: { type: Schema.Types.ObjectId, ref: 'List', required: true },
  tmdbId: { type: Number, required: true },
  addedBy: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
  tmdbTitle: { type: String, default: null },
  tmdbPosterUrl: { type: String, default: null },
})

ListMovieSchema.index({ listId: 1, tmdbId: 1 }, { unique: true })

export default mongoose.models.ListMovie || mongoose.model<IListMovie>('ListMovie', ListMovieSchema)
