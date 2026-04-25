'use client'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { RatingBadge } from '@/components/RatingBadge'
import { MovieShelf } from '@/components/MovieShelf'
import { updateMovieState } from '@/hooks/useMovieState'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: movie } = useSWR(id ? `/api/movies/${id}` : null, fetcher)
  const { data: stateData, mutate: mutateState } = useSWR(
    id ? `/api/user/movies/${id}` : null, fetcher
  )
  const { data: listsData, mutate: mutateLists } = useSWR('/api/lists', fetcher)
  const { data: recsData } = useSWR(id ? `/api/movies/${id}/recommendations` : null, fetcher)

  const [tab, setTab] = useState<'sinopsis' | 'reparto' | 'notas'>('sinopsis')
  const [noteDraft, setNoteDraft] = useState('')
  const [editingNote, setEditingNote] = useState(false)
  const [showLists, setShowLists] = useState(false)

  const state = stateData?.entry
  const lists = listsData?.lists ?? []
  const recs = recsData?.results ?? []

  async function handleRate(rating: number) {
    await updateMovieState(Number(id), { rating, watched: true })
    mutateState()
  }

  async function handleWatched() {
    await updateMovieState(Number(id), { watched: !state?.watched })
    mutateState()
  }

  async function saveNote() {
    await updateMovieState(Number(id), { notes: noteDraft })
    mutateState()
    setEditingNote(false)
  }

  if (!movie) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: 'var(--ink-mute)' }}>
        Cargando…
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 460, overflow: 'hidden', background: 'var(--bg-elevated)' }}>
        {movie.backdropUrl && (
          <Image src={movie.backdropUrl} alt={movie.title} fill sizes="100vw" style={{ objectFit: 'cover', opacity: 0.45 }} priority />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0.5) 0%, var(--bg) 100%)' }} />
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          style={{
            position: 'absolute', top: 16, left: 16,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            border: '1px solid var(--line-strong)', cursor: 'pointer',
            color: 'var(--ink)', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >‹</button>
        <div style={{ position: 'absolute', left: 22, right: 22, bottom: 24 }}>
          {movie.genres?.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>
              {movie.genres.slice(0, 2).join(' · ')}
            </div>
          )}
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--ink)', marginBottom: 8, margin: '0 0 8px', lineHeight: 1.05 }}>
            {movie.title}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--ink-dim)' }}>
            {[movie.director, movie.year, movie.runtime ? `${movie.runtime}m` : null].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '16px 22px', display: 'flex', gap: 10 }}>
        <button
          onClick={() => setShowLists(v => !v)}
          style={actionBtnStyle(showLists ? 'var(--accent)' : 'var(--bg-card)', showLists ? '#000' : 'var(--ink)')}
        >
          + Agregar a lista
        </button>
        <button
          onClick={handleWatched}
          style={actionBtnStyle(state?.watched ? 'var(--green)' : 'var(--bg-card)', state?.watched ? '#000' : 'var(--ink)')}
        >
          {state?.watched ? '✓ Vista' : 'Marcar vista'}
        </button>
      </div>

      {/* List picker */}
      {showLists && lists.length > 0 && (
        <div style={{ margin: '0 22px 16px', padding: 14, borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--line)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-mute)', marginBottom: 10, letterSpacing: '0.4px' }}>AGREGAR A</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lists.map((list: any) => (
              <ListToggleRow key={list._id} list={list} tmdbId={Number(id)} movie={movie} onMutate={mutateLists} />
            ))}
          </div>
        </div>
      )}

      {/* Rating */}
      <div style={{ margin: '0 22px 24px', padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Tu calificación
          </span>
          {state?.rating != null && (
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
              {state.rating}<span style={{ fontSize: 13, color: 'var(--ink-mute)', fontWeight: 400 }}>/10</span>
            </span>
          )}
        </div>
        <StarRating value={state?.rating ?? 0} onChange={handleRate} />
        {movie.voteAverage != null && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <RatingBadge value={movie.voteAverage} size={12} muted />
            <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>Promedio TMDB</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 22px' }}>
        <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
          {(['sinopsis', 'reparto', 'notas'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'transparent', border: 'none', padding: '12px 0',
              color: tab === t ? 'var(--ink)' : 'var(--ink-mute)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              textTransform: 'capitalize' as const,
            }}>{t === 'notas' ? 'Mis notas' : t}</button>
          ))}
        </div>

        {tab === 'sinopsis' && (
          <div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-dim)', marginBottom: 24, margin: '0 0 24px' }}>
              {movie.overview ?? 'Sin sinopsis disponible.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {([['Dirección', movie.director], ['Año', movie.year], ['Duración', movie.runtime ? `${movie.runtime}m` : null], ['País', movie.country]] as [string, any][])
                .filter(([, v]) => v != null)
                .map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: 'var(--ink-mute)', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 14, color: 'var(--ink)' }}>{v}</div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'reparto' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(movie.cast ?? []).length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--ink-mute)', gridColumn: '1/-1' }}>Reparto no disponible.</div>
            )}
            {(movie.cast ?? []).map((name: string, i: number) => (
              <div key={name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: 10, borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)', border: '1px solid var(--line)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                }}>
                  {name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 2 }}>{i === 0 ? 'Protagonista' : 'Reparto'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'notas' && (
          <div>
            {!state?.notes && !editingNote && (
              <div style={{ textAlign: 'center', padding: 28, borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', border: '1px dashed var(--line-strong)' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Sin notas todavía</div>
                <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 16 }}>¿Qué te pareció?</div>
                <button onClick={() => { setNoteDraft(''); setEditingNote(true) }} style={actionBtnStyle('var(--bg-elevated)')}>
                  Escribir nota
                </button>
              </div>
            )}
            {state?.notes && !editingNote && (
              <div>
                <div style={{ padding: 16, borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', borderLeft: '3px solid var(--accent)', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-dim)', whiteSpace: 'pre-wrap' }}>
                  {state.notes}
                </div>
                <button onClick={() => { setNoteDraft(state.notes); setEditingNote(true) }} style={{ marginTop: 10, ...actionBtnStyle('var(--bg-card)') }}>
                  Editar
                </button>
              </div>
            )}
            {editingNote && (
              <div>
                <textarea
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                  placeholder="¿Qué te pareció?"
                  autoFocus
                  style={{
                    width: '100%', minHeight: 140, padding: 14,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)', border: '1px solid var(--line-strong)',
                    color: 'var(--ink)', fontSize: 14, lineHeight: 1.5,
                    resize: 'vertical', outline: 'none',
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={saveNote} style={actionBtnStyle('var(--accent)', '#000')}>Guardar</button>
                  <button onClick={() => setEditingNote(false)} style={actionBtnStyle('var(--bg-card)')}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommendations */}
      {recs.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.4px', padding: '0 22px', marginBottom: 14, margin: '0 0 14px' }}>
            Similares
          </h2>
          <MovieShelf movies={recs} />
        </div>
      )}
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const display = hover || value
  return (
    <div style={{ display: 'flex', gap: 3 }} role="group" aria-label="Calificación">
      {Array.from({ length: 10 }, (_, i) => i + 1).map(i => (
        <svg
          key={i}
          width={22} height={22} viewBox="0 0 20 20"
          style={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          role="button"
          aria-label={`${i} estrella${i !== 1 ? 's' : ''}`}
        >
          <path
            d="M10 1 L12.5 7 L19 7.5 L14 12 L15.5 18.5 L10 15 L4.5 18.5 L6 12 L1 7.5 L7.5 7 Z"
            fill={i <= display ? 'var(--gold)' : 'rgba(255,255,255,0.12)'}
          />
        </svg>
      ))}
    </div>
  )
}

function ListToggleRow({ list, tmdbId, movie, onMutate }: { list: any; tmdbId: number; movie: any; onMutate: () => void }) {
  const { data, mutate } = useSWR(`/api/lists/${list._id}/movies`, fetcher)
  const inList = (data?.movies ?? []).some((m: any) => m.tmdbId === tmdbId)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    if (inList) {
      await fetch(`/api/lists/${list._id}/movies`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId }),
      })
    } else {
      await fetch(`/api/lists/${list._id}/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId, tmdbTitle: movie.title, tmdbPosterUrl: movie.posterUrl }),
      })
    }
    await mutate()
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{list.name}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1 }}>{list.isShared ? 'Compartida' : 'Personal'}</div>
      </div>
      <button
        disabled={loading}
        onClick={toggle}
        style={{
          padding: '6px 14px', borderRadius: 6, border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
          background: inList ? 'var(--green)' : 'var(--bg-elevated)',
          color: inList ? '#000' : 'var(--ink-mute)',
        }}
      >
        {inList ? 'En lista ✓' : 'Agregar'}
      </button>
    </div>
  )
}

function actionBtnStyle(bg: string, color = 'var(--ink)'): React.CSSProperties {
  return {
    padding: '9px 16px', borderRadius: 'var(--radius-md)',
    background: bg, border: '1px solid var(--line-strong)',
    color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  }
}
