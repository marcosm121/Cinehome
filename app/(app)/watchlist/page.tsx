'use client'
import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function WatchlistPage() {
  const { data, mutate } = useSWR('/api/lists', fetcher)
  const lists = data?.lists ?? []
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newShared, setNewShared] = useState(false)

  async function createList() {
    if (!newName.trim()) return
    await fetch('/api/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), isShared: newShared }),
    })
    setNewName('')
    setNewShared(false)
    setCreating(false)
    mutate()
  }

  return (
    <div style={{ padding: '24px 22px 110px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--ink)', margin: 0 }}>
          Mis listas
        </h1>
        <button
          onClick={() => setCreating(true)}
          style={{
            padding: '8px 16px', borderRadius: 'var(--radius-md)',
            background: 'var(--accent)', color: '#000',
            fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
          }}
        >
          + Nueva
        </button>
      </div>

      {creating && (
        <div style={{
          padding: 16, marginBottom: 20,
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line-strong)',
        }}>
          <input
            autoFocus
            placeholder="Nombre de la lista"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createList()}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-elevated)', border: '1px solid var(--line-strong)',
              color: 'var(--ink)', fontSize: 14, outline: 'none', marginBottom: 10,
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
            <input type="checkbox" checked={newShared} onChange={e => setNewShared(e.target.checked)} />
            <span style={{ fontSize: 13, color: 'var(--ink-dim)' }}>Compartida (visible para los dos)</span>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createList} style={{ padding: '9px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
              Crear
            </button>
            <button onClick={() => { setCreating(false); setNewName('') }} style={{ padding: '9px 16px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-mute)', cursor: 'pointer', fontSize: 13 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {lists.map((list: any) => (
          <ListCard key={list._id} list={list} />
        ))}
        {!lists.length && !creating && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-faint)', fontSize: 14 }}>
            Todavía no tenés listas. ¡Creá una!
          </div>
        )}
      </div>
    </div>
  )
}

function ListCard({ list }: { list: any }) {
  const { data } = useSWR(`/api/lists/${list._id}/movies`, fetcher)
  const movies: any[] = data?.movies ?? []

  return (
    <Link href={`/watchlist/${list._id}`} style={{ textDecoration: 'none' }}>
    <div style={{
      padding: 16, borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-card)', border: '1px solid var(--line)',
      cursor: 'pointer', transition: 'border-color 120ms',
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--line-strong)')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: movies.length ? 12 : 0 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink)' }}>{list.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 3 }}>
            {movies.length} {movies.length === 1 ? 'película' : 'películas'} · {list.isShared ? '🤝 Compartida' : 'Personal'}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      {movies.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {movies.slice(0, 8).map((m: any) => (
            <div key={m.tmdbId} style={{ width: 56, flexShrink: 0 }}>
                <div style={{ aspectRatio: '2/3', background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                  {m.tmdbPosterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.tmdbPosterUrl.replace('w500', 'w92')} alt={m.tmdbTitle ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--ink-faint)', padding: 4, textAlign: 'center', lineHeight: 1.2 }}>
                      {m.tmdbTitle}
                    </div>
                  )}
                </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </Link>
  )
}
