'use client'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ProfilePage() {
  const router = useRouter()
  const { data: user } = useSWR('/api/auth/me', fetcher)
  const { data: moviesData } = useSWR('/api/user/movies', fetcher)
  const entries = moviesData?.entries ?? []
  const watched = entries.filter((e: any) => e.watched)
  const rated = watched.filter((e: any) => e.rating != null)
  const avg = rated.length
    ? (rated.reduce((s: number, e: any) => s + e.rating, 0) / rated.length).toFixed(1)
    : '—'

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  return (
    <div style={{ padding: '24px 22px 110px' }}>
      {/* Avatar + name */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'var(--bg-card)', border: '1px solid var(--line-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, color: 'var(--accent)', marginBottom: 12,
        }}>
          {user?.name?.[0] ?? '?'}
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.8px', margin: '0 0 4px' }}>
          {user?.name ?? '…'}
        </h1>
        <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>@{user?.username}</div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
        background: 'var(--line)', borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', marginBottom: 32,
      }}>
        <StatBox n={watched.length} label="Vistas" />
        <StatBox n={avg} label="Rating promedio" accent />
        <StatBox n={rated.length} label="Calificadas" />
        <StatBox n={entries.length - watched.length} label="En listas" />
      </div>

      {/* Placeholder section */}
      <div style={{
        padding: 24, borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)', border: '1px solid var(--line)',
        textAlign: 'center', marginBottom: 24,
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🎬</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
          Más stats próximamente
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>
          Géneros favoritos, comparativa con tu pareja, racha de vistas…
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        style={{
          width: '100%', padding: 13, borderRadius: 'var(--radius-md)',
          background: 'transparent', border: '1px solid var(--line-strong)',
          color: 'var(--red)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
        }}
      >
        Cerrar sesión
      </button>
    </div>
  )
}

function StatBox({ n, label, accent }: { n: string | number; label: string; accent?: boolean }) {
  return (
    <div style={{ padding: 18, background: 'var(--bg-card)' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--ink)', letterSpacing: '-0.8px' }}>{n}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>{label}</div>
    </div>
  )
}
