import { connectDB } from './db'
import User, { IUser } from './models/User'

export type AppUser = Pick<IUser, '_id' | 'name' | 'username' | 'isAdmin' | 'passwordHash' | 'sessionVersion'>

export async function getUserByUsername(username: string): Promise<AppUser | null> {
  await connectDB()
  return User.findOne({ username }).lean() as Promise<AppUser | null>
}

export async function getUserById(id: string): Promise<AppUser | null> {
  await connectDB()
  return User.findById(id).lean() as Promise<AppUser | null>
}

export async function getAllUsers(): Promise<AppUser[]> {
  await connectDB()
  return User.find({}, { passwordHash: 0 }).lean() as Promise<AppUser[]>
}
