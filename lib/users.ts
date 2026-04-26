export interface AppUser {
  id: string
  name: string
  username: string
  password: string
}

const USERS: AppUser[] = [
  {
    id: process.env.USER1_ID ?? 'user1',
    name: process.env.USER1_NAME ?? '',
    username: process.env.USER1_USERNAME ?? '',
    password: process.env.USER1_PASSWORD ?? '',
  },
  {
    id: process.env.USER2_ID ?? 'user2',
    name: process.env.USER2_NAME ?? '',
    username: process.env.USER2_USERNAME ?? '',
    password: process.env.USER2_PASSWORD ?? '',
  },
]

export function getUsers(): AppUser[] { return USERS }

export function getUserByUsername(username: string): AppUser | null {
  return USERS.find(u => u.username === username) ?? null
}

export function getUserById(id: string): AppUser | null {
  return USERS.find(u => u.id === id) ?? null
}
