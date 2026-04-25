import mongoose, { Schema, Document } from 'mongoose'

export interface ITmdbCache extends Document {
  _id: string
  data: unknown
  expiresAt: Date
}

const TmdbCacheSchema = new Schema<ITmdbCache>({
  _id: { type: String },
  data: { type: Schema.Types.Mixed },
  expiresAt: { type: Date },
})

TmdbCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.models.TmdbCache || mongoose.model<ITmdbCache>('TmdbCache', TmdbCacheSchema)
