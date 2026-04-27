'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function SetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const tempToken = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, password }),
      })
      if (res.ok) {
        router.replace('/')
        return
      }
      const data = await res.json().catch(() => ({}))
      setError((data as any).error || 'Error al guardar contraseña')
    } catch {
      setError('No se pudo conectar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '0 16px' }}>
      <div style={{ width: '100%', maxWidth: 360, padding: 32, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line-strong)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 6px', color: 'var(--ink)' }}>Creá tu contraseña</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: '0 0 24px' }}>Es la primera vez que entrás. Elegí una contraseña para tu cuenta.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="pw" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.4px' }}>Contraseña</label>
            <input id="pw" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus
              style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--line-strong)', color: 'var(--ink)', fontSize: 14, outline: 'none', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="confirm" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.4px' }}>Repetir contraseña</label>
            <input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--line-strong)', color: 'var(--ink)', fontSize: 14, outline: 'none', width: '100%' }} />
          </div>
          {error && <p role="alert" style={{ fontSize: 13, color: 'var(--red)', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ padding: 13, borderRadius: 8, marginTop: 4, background: loading ? 'var(--bg-hover)' : 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}>
            {loading ? 'Guardando…' : 'Crear contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  )
}
