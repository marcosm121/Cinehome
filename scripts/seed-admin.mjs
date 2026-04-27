import mongoose from 'mongoose'
import { config } from 'dotenv'
config({ path: '.env.local' })

const UserSchema = new mongoose.Schema({
  _id: { type: String },
  name: String,
  username: String,
  isAdmin: Boolean,
  passwordHash: { type: String, default: null },
  sessionVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)

await mongoose.connect(process.env.MONGODB_URI)

const existing = await User.findById('marcos')
if (existing) {
  console.log('Admin user already exists:', existing.username)
} else {
  await User.create({
    _id: 'marcos',
    name: 'Marcos',
    username: 'marcos',
    isAdmin: true,
    passwordHash: null,
    sessionVersion: 0,
  })
  console.log('✓ Admin user marcos created. Password will be set on first login.')
}

await mongoose.disconnect()
