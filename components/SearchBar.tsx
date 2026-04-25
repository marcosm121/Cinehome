'use client'
import { useState, useEffect, useRef, useId } from 'react'
import { useRouter } from 'next/navigation'
import type { NormalizedMovie } from '@/lib/tmdb'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NormalizedMovie[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const listboxId = useId()

  useEffect(() => {
    clearTimeout(timer.current)
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer.current)
  }, [query])

  function select(movie: NormalizedMovie) {
    setQuery('')
    setOpen(false)
    router.push(`/movie/${movie.tmdbId}`)
  }

  return (
    <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
      <div style={{ position: 'relative' }}>
        <svg
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--ink-faint)" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          type="search"
          role="combobox"
          aria-label="Buscar película"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          placeholder="Buscar película..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          style={{
            width: '100%', padding: '9px 12px 9px 36px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--line-strong)',
            color: 'var(--ink)', fontSize: 14, outline: 'none',
          }}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--ink-faint)' }}
            aria-live="polite" aria-label="Buscando">
            …
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Resultados de búsqueda"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--line-strong)',
            borderRadius: 'var(--radius-md)', overflow: 'hidden', zIndex: 100,
            maxHeight: 360, overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
          {results.slice(0, 8).map((m) => (
            <div
              key={m.tmdbId}
              role="option"
              aria-selected="false"
              onMouseDown={() => select(m)}
              style={{
                display: 'flex', gap: 12, padding: '10px 14px', cursor: 'pointer',
                alignItems: 'center',
                borderBottom: '1px solid var(--line)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {m.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.posterUrl.replace('w500', 'w92')}
                  alt=""
                  width={32}
                  height={48}
                  style={{ borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 32, height: 48, borderRadius: 4, background: 'var(--bg-card)', flexShrink: 0 }} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                  {[m.year, m.genres?.[0]].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
