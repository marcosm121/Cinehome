export interface AppUser {
  id: string
  name: string
  username: string
  passwordHash: string
}

export function getUsers(): AppUser[] {
  return [
    {
      id: process.env.USER1_ID!,
      name: process.env.USER1_NAME!,
      username: process.env.USER1_USERNAME!,
      passwordHash: process.env.USER1_PASSWORD_HASH!,
    },
    {
      id: process.env.USER2_ID!,
      name: process.env.USER2_NAME!,
      username: process.env.USER2_USERNAME!,
      passwordHash: process.env.USER2_PASSWORD_HASH!,
    },
  ]
}

export function getUserByUsername(username: string): AppUser | null {
  return getUsers().find(u => u.username === username) ?? null
}

export function getUserById(id: string): AppUser | null {
  return getUsers().find(u => u.id === id) ?? null
}
