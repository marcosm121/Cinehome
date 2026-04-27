import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document<string> {
  _id: string
  name: string
  username: string
  isAdmin: boolean
  passwordHash: string | null // null = first login pending
  sessionVersion: number
  createdAt: Date
}

const UserSchema = new Schema<IUser>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  username: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  passwordHash: { type: String, default: null },
  sessionVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

UserSchema.index({ username: 1 }, { unique: true })

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
