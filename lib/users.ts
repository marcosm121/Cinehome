export interface AppUser {
  id: string
  name: string
  username: string
  passwordHash: string
}

const USERS: AppUser[] = [
  {
    id: process.env.USER1_ID ?? 'user1',
    name: process.env.USER1_NAME ?? '',
    username: process.env.USER1_USERNAME ?? '',
    passwordHash: process.env.USER1_PASSWORD_HASH ?? '',
  },
  {
    id: process.env.USER2_ID ?? 'user2',
    name: process.env.USER2_NAME ?? '',
    username: process.env.USER2_USERNAME ?? '',
    passwordHash: process.env.USER2_PASSWORD_HASH ?? '',
  },
]

export function getUsers(): AppUser[] { return USERS }

export function getUserByUsername(username: string): AppUser | null {
  return USERS.find(u => u.username === username) ?? null
}

export function getUserById(id: string): AppUser | null {
  return USERS.find(u => u.id === id) ?? null
}
