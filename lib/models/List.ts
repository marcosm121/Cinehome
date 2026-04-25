import mongoose, { Schema, Document } from 'mongoose'

export interface IList extends Document {
  name: string
  ownerId: string
  isShared: boolean
  createdAt: Date
}

const ListSchema = new Schema<IList>({
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  isShared: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.List || mongoose.model<IList>('List', ListSchema)
