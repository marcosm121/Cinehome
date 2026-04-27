import mongoose, { Schema, Document } from 'mongoose'

export interface IList extends Document {
  name: string
  ownerId: string
  sharedWith: string[]
  createdAt: Date
  coverTmdbId: number | null
  coverPosterUrl: string | null
}

const ListSchema = new Schema<IList>({
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  sharedWith: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  coverTmdbId: { type: Number, default: null },
  coverPosterUrl: { type: String, default: null },
})

export default mongoose.models.List || mongoose.model<IList>('List', ListSchema)
