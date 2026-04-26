export interface AppUser {
  id: string
  name: string
  username: string
  passwordHash: string
}

function decodeHash(encoded: string | undefined): string {
  if (!encoded) return ''
  // Raw bcrypt hash (Render env vars, no dotenv-expand issue)
  if (encoded.startsWith('$2')) return encoded
  // Base64-encoded hash (local .env.local, dotenv-expand strips $)
  return Buffer.from(encoded, 'base64').toString('utf-8')
}

const USERS: AppUser[] = [
  {
    id: process.env.USER1_ID ?? 'user1',
    name: process.env.USER1_NAME ?? '',
    username: process.env.USER1_USERNAME ?? '',
    passwordHash: decodeHash(process.env.USER1_PASSWORD_HASH),
  },
  {
    id: process.env.USER2_ID ?? 'user2',
    name: process.env.USER2_NAME ?? '',
    username: process.env.USER2_USERNAME ?? '',
    passwordHash: decodeHash(process.env.USER2_PASSWORD_HASH),
  },
]

export function getUsers(): AppUser[] { return USERS }

export function getUserByUsername(username: string): AppUser | null {
  return USERS.find(u => u.username === username) ?? null
}

export function getUserById(id: string): AppUser | null {
  return USERS.find(u => u.id === id) ?? null
}
