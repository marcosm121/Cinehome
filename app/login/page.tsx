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
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.replace('/')
        return
      }
      const data = await res.json().catch(() => ({}))
      setError((data as any).error || 'Error al iniciar sesión')
    } catch {
      setError('No se pudo conectar. Intentá de nuevo.')
    } finally {
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
      padding: '0 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 360,
        padding: 32,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--line-strong)',
      }}>
        <h1 style={{
          fontSize: 28, fontWeight: 800, letterSpacing: '-1px',
          margin: '0 0 6px', color: 'var(--ink)',
        }}>
          Cinehome
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: '0 0 28px' }}>
          Tu lista de películas para ver en pareja.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="username" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.4px' }}>
              Usuario
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="tu usuario"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={{
                padding: '12px 14px', borderRadius: 8,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--line-strong)',
                color: 'var(--ink)', fontSize: 14,
                outline: 'none',
                boxShadow: 'none',
                width: '100%',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-strong)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="password" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.4px' }}>
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                padding: '12px 14px', borderRadius: 8,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--line-strong)',
                color: 'var(--ink)', fontSize: 14,
                outline: 'none',
                boxShadow: 'none',
                width: '100%',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-strong)' }}
            />
          </div>
          {error && (
            <p role="alert" style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>{error}</p>
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
              width: '100%',
            }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
