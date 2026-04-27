'use client'
import useSWR from 'swr'
import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/Skeleton'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const { data, mutate, isLoading } = useSWR('/api/admin/users', fetcher)
  const users: any[] = data?.users ?? []

  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Redirect non-admins once user is loaded
  if (!userLoading && user && !user.isAdmin) {
    router.replace('/')
    return null
  }

  async function createUser() {
    if (!newName.trim() || !newUsername.trim()) return
    setCreateError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), username: newUsername.trim() }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setCreateError(data.error ?? 'Error'); return }
    setNewName(''); setNewUsername(''); setCreating(false)
    mutate()
  }

  async function resetPassword(id: string) {
    await fetch(`/api/admin/users/${id}/reset-password`, { method: 'POST' })
    mutate()
  }

  async function deleteUser(id: string) {
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    mutate()
  }

  if (isLoading) return (
    <div style={{ padding: '24px 22px' }}>
      <Skeleton width={120} height={36} borderRadius={8} style={{ marginBottom: 20 }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} height={64} borderRadius={12} style={{ marginBottom: 10 }} />
      ))}
    </div>
  )

  return (
    <div style={{ padding: '24px 22px 110px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>Admin</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: 'var(--ink)', margin: 0 }}>Usuarios</h1>
      </div>

      {/* User list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {users.map((u: any) => (
          <div key={u._id} style={{
            padding: '14px 16px', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-card)', border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {u.name}
                {u.isAdmin && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 'var(--radius-pill)', letterSpacing: '0.5px' }}>
                    ADMIN
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>
                @{u.username}
                {u.passwordHash === null && (
                  <span style={{ color: 'var(--gold)', marginLeft: 6 }}>· Sin contraseña</span>
                )}
              </div>
            </div>
            {!u.isAdmin && (
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => resetPassword(u._id)} style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                  background: 'transparent', border: '1px solid var(--line-strong)',
                  color: 'var(--ink-mute)', fontSize: 12, cursor: 'pointer',
                }}>
                  Resetear contraseña
                </button>
                {confirmDelete === u._id ? (
                  <>
                    <button onClick={() => deleteUser(u._id)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--red)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                      Confirmar
                    </button>
                    <button onClick={() => setConfirmDelete(null)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-mute)', fontSize: 12, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDelete(u._id)} style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', fontSize: 12, cursor: 'pointer' }}>
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create user */}
      {creating ? (
        <div style={{ padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--line-strong)' }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 14 }}>Nuevo usuario</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} autoFocus
              style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--line-strong)', color: 'var(--ink)', fontSize: 14, outline: 'none' }} />
            <input placeholder="Usuario (para el login)" value={newUsername} onChange={e => setNewUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createUser()}
              style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--line-strong)', color: 'var(--ink)', fontSize: 14, outline: 'none' }} />
            {createError && <p style={{ margin: 0, fontSize: 13, color: 'var(--red)' }}>{createError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={createUser} style={{ padding: '9px 16px', borderRadius: 8, background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                Crear
              </button>
              <button onClick={() => { setCreating(false); setNewName(''); setNewUsername(''); setCreateError('') }}
                style={{ padding: '9px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-mute)', cursor: 'pointer', fontSize: 13 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)} style={{
          width: '100%', padding: 13, borderRadius: 'var(--radius-md)',
          background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
        }}>
          + Agregar usuario
        </button>
      )}
    </div>
  )
}
