import { signToken, verifyToken } from '@/lib/auth'

describe('auth utils', () => {
  it('signs and verifies a token round-trip', async () => {
    const payload = { userId: 'marcos', username: 'marcos', name: 'Marcos', isAdmin: true, sessionVersion: 0 }
    const token = await signToken(payload)
    const result = await verifyToken(token)
    expect(result?.userId).toBe('marcos')
  })

  it('returns null for invalid token', async () => {
    const result = await verifyToken('bad.token.here')
    expect(result).toBeNull()
  })
})
