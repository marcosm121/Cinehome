'use client'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RatingBadge } from '@/components/RatingBadge'

const fetcher = (url: string) => fetch(url).then(r => r.json())

type SortKey = 'added' | 'runtime' | 'title' | 'rating'
type ViewMode = 'grid' | 'list'

export default function ListDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: listsData } = useSWR('/api/lists', fetcher)
  const { data: moviesData, mutate: mutateMovies } = useSWR(`/api/lists/${id}/movies`, fetcher)
  const { data: usersData } = useSWR('/api/users', fetcher)
  const { data: meData } = useSWR('/api/auth/me', fetcher)

  const [sort, setSort] = useState<SortKey>('added')
  const [view, setView] = useState<ViewMode>('grid')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const list = listsData?.lists?.find((l: any) => l._id === id)
  const listMovies: any[] = moviesData?.movies ?? []
  const users: any[] = usersData?.users ?? []
  const me = meData

  const isOwner = list && me && list.ownerId === me.id
  const otherUsers = users.filter(u => u.id !== list?.ownerId)

  // Fetch TMDB details for each movie to get runtime/genres
  const tmdbIds = listMovies.map(m => m.tmdbId)
  const { data: bulkState } = useSWR(
    tmdbIds.length ? `/api/user/movies?tmdbIds=${tmdbIds.join(',')}` : null,
    fetcher
  )
  const userStates: Record<number, any> = {}
  for (const e of bulkState?.entries ?? []) userStates[e.tmdbId] = e

  // Use tmdbTitle/tmdbPosterUrl stored in list, don't N+1 TMDB for basic display
  // Fetch full details only when needed for stats — use a single movie hook per item
  const movieDetails = useMovieDetailsBulk(tmdbIds)

  // Stats
  const totalMin = movieDetails.reduce((s, m) => s + (m?.runtime ?? 0), 0)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  const allGenres = new Set(movieDetails.flatMap(m => m?.genres ?? []))

  // Sort
  const sorted = [...listMovies].sort((a, b) => {
    if (sort === 'added') return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    if (sort === 'runtime') {
      const ra = movieDetails.find(m => m?.tmdbId === a.tmdbId)?.runtime ?? 0
      const rb = movieDetails.find(m => m?.tmdbId === b.tmdbId)?.runtime ?? 0
      return ra - rb
    }
    if (sort === 'title') return (a.tmdbTitle ?? '').localeCompare(b.tmdbTitle ?? '')
    if (sort === 'rating') {
      const ra = movieDetails.find(m => m?.tmdbId === a.tmdbId)?.voteAverage ?? 0
      const rb = movieDetails.find(m => m?.tmdbId === b.tmdbId)?.voteAverage ?? 0
      return rb - ra
    }
    return 0
  })

  async function saveName() {
    if (!nameDraft.trim() || nameDraft === list?.name) { setEditingName(false); return }
    setSaving(true)
    await fetch(`/api/lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameDraft.trim() }),
    })
    setSaving(false)
    setEditingName(false)
    mutateMovies()
    // Revalidate lists
    await fetch('/api/lists')
  }

  async function toggleShared() {
    await fetch(`/api/lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isShared: !list.isShared }),
    })
    // Trigger revalidation via router refresh
    router.refresh()
  }

  async function removeMovie(tmdbId: number) {
    await fetch(`/api/lists/${id}/movies`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId }),
    })
    mutateMovies()
  }

  async function deleteList() {
    await fetch(`/api/lists/${id}`, { method: 'DELETE' })
    router.push('/watchlist')
  }

  if (!list) {
    return <div style={{ padding: 40, color: 'var(--ink-mute)' }}>Cargando…</div>
  }

  return (
    <div style={{ padding: '24px 22px 110px', maxWidth: 1080, margin: '0 auto' }}>

      {/* Back */}
      <button onClick={() => router.back()} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--ink-mute)', fontSize: 13, padding: '0 0 16px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Mis listas
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>
          {list.isShared ? '🤝 Lista compartida' : 'Mi lista'}
        </div>

        {editingName ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <input
              autoFocus
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
              style={{
                fontSize: 30, fontWeight: 800, letterSpacing: '-1.2px',
                background: 'transparent', border: 'none', borderBottom: '2px solid var(--accent)',
                color: 'var(--ink)', outline: 'none', width: '100%', maxWidth: 400,
              }}
            />
            <button onClick={saveName} disabled={saving} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#000', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>
              {saving ? '…' : 'Guardar'}
            </button>
            <button onClick={() => setEditingName(false)} style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-mute)', fontSize: 13, cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        ) : (
          <h1
            onClick={() => { if (isOwner) { setNameDraft(list.name); setEditingName(true) } }}
            style={{
              fontSize: 30, fontWeight: 800, letterSpacing: '-1.2px', color: 'var(--ink)',
              margin: '0 0 16px', cursor: isOwner ? 'text' : 'default',
              display: 'inline-flex', alignItems: 'center', gap: 10,
            }}
          >
            {list.name}
            {isOwner && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" strokeWidth="2" style={{ flexShrink: 0 }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            )}
          </h1>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'baseline', flexWrap: 'wrap' }}>
          <StatItem n={listMovies.length} label={listMovies.length === 1 ? 'película' : 'películas'} />
          {totalMin > 0 && (
            <>
              <Divider />
              <StatItem n={`${hours}h ${mins}m`} label="tiempo total" />
            </>
          )}
          {allGenres.size > 0 && (
            <>
              <Divider />
              <StatItem n={allGenres.size} label="géneros" />
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
        marginBottom: 24, gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {([['added','Agregadas'],['runtime','Duración'],['title','Título'],['rating','Rating']] as [SortKey, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setSort(key)} style={{
              padding: '6px 14px', borderRadius: 'var(--radius-pill)',
              background: sort === key ? 'var(--ink)' : 'transparent',
              color: sort === key ? 'var(--bg)' : 'var(--ink-mute)',
              border: `1px solid ${sort === key ? 'var(--ink)' : 'var(--line-strong)'}`,
              fontSize: 13, fontWeight: sort === key ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <ViewBtn active={view === 'grid'} onClick={() => setView('grid')}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="1" y="1" width="5.5" height="5.5"/><rect x="8.5" y="1" width="5.5" height="5.5"/>
              <rect x="1" y="8.5" width="5.5" height="5.5"/><rect x="8.5" y="8.5" width="5.5" height="5.5"/>
            </svg>
          </ViewBtn>
          <ViewBtn active={view === 'list'} onClick={() => setView('list')}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="1" y1="3.5" x2="14" y2="3.5"/><line x1="1" y1="7.5" x2="14" y2="7.5"/><line x1="1" y1="11.5" x2="14" y2="11.5"/>
            </svg>
          </ViewBtn>
          {isOwner && (
            <ViewBtn active={showSettings} onClick={() => setShowSettings(v => !v)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </ViewBtn>
          )}
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && isOwner && (
        <div style={{
          marginBottom: 24, padding: 20,
          background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--line)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>Configuración de la lista</div>

          {/* Sharing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Lista compartida</div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>
                  {list.isShared
                    ? `Visible para ${otherUsers.map(u => u.name).join(', ')}`
                    : 'Solo vos la podés ver'}
                </div>
              </div>
              <Toggle checked={list.isShared} onChange={toggleShared} />
            </div>

            {list.isShared && otherUsers.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {otherUsers.map((u: any) => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: 'var(--bg-hover)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: 'var(--accent)',
                    }}>{u.name[0]}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>@{u.username} · puede ver y agregar</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Acceso ✓</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <div style={{ paddingTop: 16 }}>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{
                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                background: 'transparent', border: '1px solid var(--red)',
                color: 'var(--red)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Eliminar lista</button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>¿Confirmar eliminación?</span>
                <button onClick={deleteList} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--red)', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Eliminar</button>
                <button onClick={() => setConfirmDelete(false)} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', background: 'transparent', border: '1px solid var(--line-strong)', color: 'var(--ink-mute)', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {listMovies.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--ink-faint)', fontSize: 14 }}>
          Esta lista está vacía. Buscá una película y agregala desde su detalle.
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && sorted.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '28px 16px',
        }}>
          {sorted.map(m => (
            <MovieGridCard
              key={m.tmdbId}
              listMovie={m}
              detail={movieDetails.find(d => d?.tmdbId === m.tmdbId)}
              userState={userStates[m.tmdbId]}
              canRemove={isOwner || list.isShared}
              onRemove={() => removeMovie(m.tmdbId)}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && sorted.length > 0 && (
        <div>
          {sorted.map((m, i) => (
            <MovieListRow
              key={m.tmdbId}
              listMovie={m}
              detail={movieDetails.find(d => d?.tmdbId === m.tmdbId)}
              userState={userStates[m.tmdbId]}
              index={i}
              last={i === sorted.length - 1}
              canRemove={isOwner || list.isShared}
              onRemove={() => removeMovie(m.tmdbId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Hooks ────────────────────────────────────────────────
function useMovieDetailsBulk(tmdbIds: number[]) {
  // Fetch each movie's details; relies on MongoDB cache so N+1 is OK
  const fetcher = (url: string) => fetch(url).then(r => r.json())
  const results: any[] = []
  for (const id of tmdbIds) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data } = useSWR(`/api/movies/${id}`, fetcher)
    results.push(data ?? null)
  }
  return results
}

// ── Sub-components ────────────────────────────────────────
function MovieGridCard({ listMovie, detail, userState, canRemove, onRemove }: any) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ position: 'relative' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}>
      <Link href={`/movie/${listMovie.tmdbId}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ position: 'relative', aspectRatio: '2/3', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-card)' }}>
          {listMovie.tmdbPosterUrl ? (
            <Image src={listMovie.tmdbPosterUrl} alt={listMovie.tmdbTitle ?? ''} fill sizes="200px" style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--ink-faint)', padding: 8, textAlign: 'center', lineHeight: 1.3 }}>
              {listMovie.tmdbTitle}
            </div>
          )}
          {detail?.runtime && (
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 'var(--radius-sm)', padding: '3px 7px', fontSize: 10, fontWeight: 600, color: 'var(--ink)' }}>
              {detail.runtime}m
            </div>
          )}
          {userState?.rating != null && (
            <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 'var(--radius-sm)', padding: '3px 6px' }}>
              <RatingBadge value={userState.rating} size={10} />
            </div>
          )}
        </div>
        <div style={{ marginTop: 10, fontWeight: 600, fontSize: 13, color: 'var(--ink)', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {listMovie.tmdbTitle ?? `#${listMovie.tmdbId}`}
        </div>
        <div style={{ marginTop: 3, fontSize: 11, color: 'var(--ink-mute)' }}>
          {[detail?.director, detail?.year].filter(Boolean).join(' · ')}
        </div>
        {detail?.voteAverage != null && (
          <div style={{ marginTop: 6 }}><RatingBadge value={detail.voteAverage} size={11} muted /></div>
        )}
      </Link>
      {canRemove && hover && (
        <button
          onClick={e => { e.preventDefault(); onRemove() }}
          title="Quitar de la lista"
          style={{
            position: 'absolute', top: 8, right: detail?.runtime ? 40 : 8,
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            border: 'none', cursor: 'pointer', color: 'var(--red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  )
}

function MovieListRow({ listMovie, detail, userState, index, last, canRemove, onRemove }: any) {
  return (
    <div style={{
      display: 'flex', gap: 14, padding: '14px 0',
      borderBottom: last ? 'none' : '1px solid var(--line)',
      alignItems: 'center',
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', width: 22, fontWeight: 500, flexShrink: 0 }}>
        {String(index + 1).padStart(2, '0')}
      </div>
      <Link href={`/movie/${listMovie.tmdbId}`} style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0, textDecoration: 'none', alignItems: 'center' }}>
        <div style={{ width: 46, height: 69, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-card)' }}>
          {listMovie.tmdbPosterUrl && (
            <Image src={listMovie.tmdbPosterUrl.replace('w500','w92')} alt="" width={46} height={69} style={{ objectFit: 'cover' }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', letterSpacing: '-0.2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {listMovie.tmdbTitle ?? `#${listMovie.tmdbId}`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 3 }}>
            {[detail?.director, detail?.year, detail?.runtime ? `${detail.runtime}m` : null, detail?.genres?.[0]].filter(Boolean).join(' · ')}
          </div>
        </div>
      </Link>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
        {detail?.voteAverage != null && <RatingBadge value={detail.voteAverage} size={12} muted />}
        {userState?.rating != null && <RatingBadge value={userState.rating} size={12} />}
        {canRemove && (
          <button onClick={onRemove} title="Quitar" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 4, display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ── Utility components ────────────────────────────────────
function StatItem({ n, label }: { n: string | number; label: string }) {
  return (
    <div>
      <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.6px' }}>{n}</span>
      <span style={{ fontSize: 12, color: 'var(--ink-mute)', marginLeft: 6 }}>{label}</span>
    </div>
  )
}

function Divider() {
  return <div style={{ width: 1, height: 22, background: 'var(--line)' }} />
}

function ViewBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: 8, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
      background: active ? 'var(--ink)' : 'transparent',
      border: `1px solid ${active ? 'var(--ink)' : 'var(--line-strong)'}`,
      color: active ? 'var(--bg)' : 'var(--ink-mute)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? 'var(--accent)' : 'var(--bg-elevated)',
        border: `1px solid ${checked ? 'var(--accent)' : 'var(--line-strong)'}`,
        cursor: 'pointer', position: 'relative', flexShrink: 0,
        transition: 'background 160ms, border-color 160ms',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: checked ? '#000' : 'var(--ink-faint)',
        transition: 'left 160ms',
      }} />
    </button>
  )
}
