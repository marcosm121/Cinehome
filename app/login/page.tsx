'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (res.ok) {
      router.replace('/')
    } else {
      const data = await res.json()
      setError(data.error || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{
        width: 360,
        padding: 32,
        background: 'var(--bg-card)',
        borderRadius: 14,
        border: '1px solid var(--line-strong)',
      }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, letterSpacing: -1,
          margin: '0 0 6px', color: 'var(--ink)',
        }}>
          Cinehome
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: '0 0 28px' }}>
          Tu lista de películas para ver en pareja.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={{
              padding: '12px 14px', borderRadius: 8,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--line-strong)',
              color: 'var(--ink)', fontSize: 14, outline: 'none',
              width: '100%', boxSizing: 'border-box',
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              padding: '12px 14px', borderRadius: 8,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--line-strong)',
              color: 'var(--ink)', fontSize: 14, outline: 'none',
              width: '100%', boxSizing: 'border-box',
            }}
          />
          {error && (
            <p style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px', borderRadius: 8, marginTop: 4,
              background: loading ? 'var(--bg-hover)' : 'var(--accent)',
              color: loading ? 'var(--ink-mute)' : '#000',
              fontWeight: 700, fontSize: 15, border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 120ms',
            }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
