'use client'
import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

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
          padding: 16, marginBottom: 24,
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

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16,
      }}>
        {lists.map((list: any) => (
          <ListCard key={list._id} list={list} />
        ))}
      </div>

      {!lists.length && !creating && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-faint)', fontSize: 14 }}>
          Todavía no tenés listas. ¡Creá una!
        </div>
      )}
    </div>
  )
}

function ListCard({ list }: { list: any }) {
  const { data } = useSWR(`/api/lists/${list._id}/movies`, fetcher)
  const movies: any[] = data?.movies ?? []

  // Cover: explicit selection first, then most recently added
  const coverUrl = list.coverPosterUrl ?? movies[0]?.tmdbPosterUrl ?? null

  return (
    <Link href={`/watchlist/${list._id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        aspectRatio: '3/4',
        background: 'var(--bg-card)',
        border: '1px solid var(--line)',
        cursor: 'pointer',
        transition: 'transform 150ms, box-shadow 150ms',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}>

        {/* Poster */}
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={list.name}
            fill
            sizes="200px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-card) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--line-strong)" strokeWidth="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.85) 100%)',
        }} />

        {/* Shared badge — top left */}
        {list.isShared && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-pill)', padding: '3px 8px',
            fontSize: 10, fontWeight: 600, color: 'var(--accent)',
          }}>🤝 Compartida</div>
        )}

        {/* Count badge — top right */}
        <div style={{
          position: 'absolute', top: 10, right: 10,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          borderRadius: 'var(--radius-pill)', padding: '3px 8px',
          fontSize: 10, fontWeight: 600, color: 'var(--ink)',
        }}>
          {movies.length} {movies.length === 1 ? 'peli' : 'pelis'}
        </div>

        {/* Title — bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '12px 12px 14px',
        }}>
          <div style={{
            fontWeight: 700, fontSize: 15, color: 'var(--ink)',
            letterSpacing: '-0.3px', lineHeight: 1.2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {list.name}
          </div>
        </div>
      </div>
    </Link>
  )
}
